// Service worker voor pushmeldingen. De Firebase-config komt mee via de URL vanuit index.html,
// dus je hoeft hier niets in te vullen.
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

const config = JSON.parse(new URLSearchParams(self.location.search).get('c') || '{}');
firebase.initializeApp(config);
firebase.messaging();
