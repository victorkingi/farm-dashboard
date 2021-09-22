const admin = require('firebase-admin');
const serviceAccount = require("./poultry101-6b1ed-4070627cf0bc.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "poultry101-6b1ed.appspot.com"
});

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
const handleFCM = require('./src/handleFCM');
const firestoreTrigger = require('./src/firestoreTrigger');
const callable = require('./src/onCall');
const scheduled = require('./src/scheduled');

exports.FCMT = firestoreTrigger;
exports.hFCM = handleFCM;
exports.util = callable;
exports.sch = scheduled;

