# 💧 Pispoint

Een kaart van alle plekken waar jij en je vrienden hebben wildgeplast. Met accounts, vriendenlijst en likes.

## Installatie

1. Open je project in de [Firebase console](https://console.firebase.google.com).
2. **Authentication** > *Aan de slag* > tabblad **Sign-in method** > zet **E-mailadres/wachtwoord** aan.
3. **Firestore Database**: maak de database aan als je die nog niet hebt (locatie bijvoorbeeld `europe-west`).
4. Firestore, tabblad **Regels**: vervang alles door de inhoud van `firestore.rules` en klik **Publiceren**.
5. **Projectinstellingen** > *Je apps* > **Web-app** (`</>`). Kopieer het `firebaseConfig`-blok en plak het bovenaan het script in `index.html`.
6. Zet `index.html` in een GitHub-repo en zet **Settings > Pages** aan (branch `main`, map `/ (root)`).

Oude testdata van eerdere versies (punten met alleen een naam) kun je in Firestore verwijderen; die zijn niet meer zichtbaar.

## Hoe het werkt

- Iedereen maakt een account met gebruikersnaam, volledige naam en wachtwoord.
- Zoek vrienden op gebruikersnaam of op een deel van hun naam (voornaam of achternaam).
- Pas als iemand je verzoek accepteert zien jullie elkaars pispoints. Dat wordt door de database zelf afgedwongen, niet alleen door de app.

## Opslag

- `users/{uid}`: gebruikersnaam, volledige naam, zoeksleutels, `friends`, `requests` en `sent`.
- `pispoints/{id}`: uid van de eigenaar, coördinaten, tijdstip en likes.
- Accounts staan in Firebase Authentication. Gebruikersnamen worden intern opgeslagen als `gebruikersnaam@pispoint.app`.

## Wachtwoord vergeten

Er is geen e-mailadres, dus geen herstelmail. Verwijder het account in **Authentication > Users** en laat de persoon opnieuw registreren met dezelfde gebruikersnaam. Zijn oude profiel en punten blijven dan wel als losse data staan.

## Foto's

- Bij je eigen pispoint kun je een foto van het uitzicht toevoegen, vervangen of weghalen. Alleen vrienden zien hem.
- Tik in je profiel op je foto om een profielfoto te kiezen.
- Foto's worden op de telefoon verkleind en opgeslagen in Firestore (`photos` en het veld `photo` in `users`). GPS- en cameragegevens worden er daarbij uitgehaald.
- Het gratis Spark-abonnement is genoeg: 1 GB opslag is ruwweg 5.000 uitzichtfoto's.
