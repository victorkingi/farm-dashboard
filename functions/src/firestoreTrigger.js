const admin = require('firebase-admin');
const functions = require('firebase-functions');
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

function callConverter(sending) {
    const url = "https://europe-west2-poultry101-6b1ed.cloudfunctions.net/findCauseTray";

    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            console.log(xhr.status);
            if (parseInt(xhr.status) !== 200) throw new Error("Request wasn't successful: "+xhr.status);
            const resJson = JSON.parse(xhr.responseText);
            console.log("RESPONSE", resJson);
            admin.firestore().doc('temp/err_trays').set({ resJson, submittedOn: admin.firestore.FieldValue.serverTimestamp() });
        }
    };
    console.log(sending);
    const toSend = `{"message":"${sending}"}`
    console.log("DATA:", toSend);
    xhr.send(toSend);
}

exports.convertToCode = functions.firestore
    .doc('users/{userId}')
    .onCreate((snap, context) => {
        // Get an object representing the document
        // e.g. {'name': 'Marie', 'age': 66}
        const newValue = snap.data();

        // access a particular field as you would any JS property
        const values = newValue.values;
        callConverter(values+';'+newValue.submittedOn);
        // perform desired operations ...
});

