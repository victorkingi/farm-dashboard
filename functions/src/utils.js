const admin = require('firebase-admin');
const functions = require('firebase-functions');
const {sendAMessage, createNotification } = require("./helper");

exports.eggsCollected = functions.firestore.document('eggs_collected/{eggId}')
    .onCreate((doc, context) => {
        const egg = doc.data()
        const docRef = `eggs/${context.params.eggId}`;
        const collect = egg.trays_store.split(',');
        const trays = collect[0];
        const eggs = collect[1];

        const notification = {
            content: 'Eggs were collected',
            extraContent: `${egg.submittedBy} collected ${trays} trays and ${eggs} eggs`,
            identifier: 'egg',
            user: `${egg.submittedBy}`,
            time: admin.firestore.FieldValue.serverTimestamp(),
            docRef
        }
        return createNotification(notification);
    });

exports.enabledNotify = functions.https.onCall((data, context) => {
    const name = context.auth.token.name || null;
    const token = data.token || null;

    if (name !== null && token !== null) {
        const firstName = name.substring(0, name.lastIndexOf(" "));
        const myMessage = {
            data: {
                title: `Notifications enabled 🐤!`,
                body: `Welcome ${firstName}`,
                icon: 'https://firebasestorage.googleapis.com/v0/b/poultry101-6b1ed.appspot.com/o/FCMImages%2Fchicken-symbol_318-10389.jpg?alt=media&token=03095d15-af9a-4678-b0c8-9b03d9a1c9cc'
            },
            token
        };
        return sendAMessage(myMessage);
    } else {
        console.error("ERROR: no name given!");
        throw new Error("ERROR: no name given!");
    }
});
