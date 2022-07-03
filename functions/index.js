const admin = require('firebase-admin');
const serviceAccount = require("./poultry101-6b1ed-4070627cf0bc.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "poultry101-6b1ed.appspot.com"
});

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
const firestoreTrigger = require('./src/firestoreTrigger');
const scheduled = require('./src/scheduled');

exports.FCMT = firestoreTrigger;
exports.sch = scheduled;

