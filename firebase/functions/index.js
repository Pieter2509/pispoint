const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { setGlobalOptions } = require('firebase-functions/v2');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');

initializeApp();
const db = getFirestore();

// Moet overeenkomen met de locatie van je Firestore-database (europe-west4 = Nederland).
setGlobalOptions({ region: 'europe-west4', maxInstances: 3 });

const nameOf = async uid => {
  const d = await db.doc(`users/${uid}`).get();
  return d.exists ? (d.get('fullName') || d.get('username')) : 'Iemand';
};

// Stuur een melding naar alle apparaten van één gebruiker
async function notify(uid, pref, title, body) {
  const priv = await db.doc(`private/${uid}`).get();
  if (priv.exists && priv.get(pref) === false) return;

  const snap = await db.collection(`private/${uid}/tokens`).get();
  if (snap.empty) return;

  const messages = snap.docs.map(d => {
    const url = d.get('url');
    const webpush = { notification: {} };
    if (url) {
      webpush.notification.icon = url + 'icon-192.png';
      webpush.fcmOptions = { link: url };
    }
    return { token: d.id, notification: { title, body }, webpush };
  });

  const res = await getMessaging().sendEach(messages);

  // Verlopen of ongeldige apparaten opruimen
  await Promise.all(res.responses.map((r, i) => {
    const code = r.error && r.error.code;
    if (code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token') {
      return snap.docs[i].ref.delete();
    }
    if (r.error) console.warn('Melding mislukt', code);
    return null;
  }));
}

// Nieuw pispoint: alle vrienden van de eigenaar krijgen een melding
exports.nieuwPispoint = onDocumentCreated('pispoints/{id}', async event => {
  const p = event.data && event.data.data();
  if (!p || !p.uid) return;
  const owner = await db.doc(`users/${p.uid}`).get();
  if (!owner.exists) return;
  const name = owner.get('fullName') || owner.get('username');
  const friends = owner.get('friends') || [];
  const stars = p.rating ? ' ' + '⭐'.repeat(Math.min(5, p.rating)) : '';
  const note = p.note ? `: "${String(p.note).slice(0, 80)}${p.note.length > 80 ? '…' : ''}"` : '';
  const tagged = p.with || [];
  await Promise.all(friends.map(f => tagged.includes(f)
    ? notify(f, 'notifyTags', 'Samen geplast 🤝', `${name} heeft je getagd in een pispoint${stars}${note}`)
    : notify(f, 'notifyPoints', 'Nieuw pispoint 💧', `${name} heeft een nieuwe pispoint achtergelaten${stars}${note}`)
  ));
});

// Vriendverzoek ontvangen of geaccepteerd
exports.vriendschap = onDocumentUpdated('users/{uid}', async event => {
  const before = event.data.before.data() || {};
  const after = event.data.after.data() || {};
  const uid = event.params.uid;
  const added = (a, b) => (a || []).filter(x => !(b || []).includes(x));

  const newRequests = added(after.requests, before.requests);
  const accepted = added(after.friends, before.friends).filter(x => (before.sent || []).includes(x));

  const jobs = [];
  for (const id of newRequests) {
    const n = await nameOf(id);
    jobs.push(notify(uid, 'notifyRequests', 'Vriendverzoek 👋', `${n} wil je vriend worden op Pispoint`));
  }
  for (const id of accepted) {
    const n = await nameOf(id);
    jobs.push(notify(uid, 'notifyRequests', 'Verzoek geaccepteerd 🎉', `${n} heeft je vriendverzoek geaccepteerd`));
  }
  await Promise.all(jobs);
});

// Pispoint gewijzigd: melding bij een nieuwe like, of als iemand achteraf getagd wordt
exports.nieuweLike = onDocumentUpdated('pispoints/{id}', async event => {
  const before = event.data.before.data() || {};
  const after = event.data.after.data() || {};

  const newTags = (after.with || []).filter(x => !(before.with || []).includes(x));
  if (newTags.length) {
    const owner = await nameOf(after.uid);
    await Promise.all(newTags.map(t => notify(t, 'notifyTags', 'Samen geplast 🤝', `${owner} heeft je getagd in een pispoint`)));
  }

  const added = (after.likes || []).filter(x => !(before.likes || []).includes(x) && x !== after.uid);
  for (const liker of added) {
    const n = await nameOf(liker);
    const note = after.note ? `: "${String(after.note).slice(0, 60)}${after.note.length > 60 ? '…' : ''}"` : '';
    await notify(after.uid, 'notifyLikes', 'Nieuwe like ❤️', `${n} vindt je pispoint leuk${note}`);
  }
});
