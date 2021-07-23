const admin = require('firebase-admin');
const functions = require('firebase-functions');
const {sendAMessage, createNotification } = require("./helper");

async function parameterChecks(firestore, values) {
    const deadSick = await firestore().collection('dead_sick')
        .orderBy("submittedOn", "desc").get();
    const chicken = await firestore().collection("chicken_details")
        .doc("current").get();
    const chickenTotal = parseInt(chicken.data().total);
    let found = false;

    if (chickenTotal < parseInt(values.chickenNo) && values.section === "Dead") {
        throw new Error("CHICKEN NUMBER LESS THAN DEAD");
    }

    for (let i = 0; i < deadSick.size; i++) {
        const doc = deadSick.docs[i];
        const data = doc.data();
        const place = data.place;
        const date = data.date ? data.date.toDate().getTime() : null;
        const section = data.section;

        const checkDate = date === values.date ? values.date.getTime() : "";
        const checkPlace = place === values.place;
        const checkSection = section === values.section;
        if (checkPlace && checkSection && checkDate) {
            found = true;
            break;
        }
    }

    if (found) {
        throw new Error("DUPLICATE DATA");
    }
}

exports.verifyDeadSickData = functions.firestore.document('dead_sick/{dsId}')
    .onCreate(((snapshot, context) => {
        const data = snapshot.data();
        parameterChecks(admin.firestore, data);
    }));

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
