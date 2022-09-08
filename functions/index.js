const admin = require('firebase-admin');
const serviceAccount = require("");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: ""
});

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
const firestoreTrigger = require('./src/firestoreTrigger');
const scheduled = require('./src/scheduled');

exports.FCMT = firestoreTrigger;
exports.sch = scheduled;

