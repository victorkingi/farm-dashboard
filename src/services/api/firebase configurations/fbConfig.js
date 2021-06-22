import firebase from "firebase/app";
import 'firebase/firestore';
import 'firebase/auth';
import 'firebase/messaging';
import 'firebase/functions';
import 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyD3tzp-dWkeucSmG8dME_J7Zlxj9vm1hvw",
    authDomain: "poultry101-6b1ed.firebaseapp.com",
    databaseURL: "https://poultry101-6b1ed.firebaseio.com",
    projectId: "poultry101-6b1ed",
    storageBucket: "poultry101-6b1ed.appspot.com",
    messagingSenderId: "921557433248",
    appId: "1:921557433248:web:5828718b6146d8a293c2c5"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

let messaging = null;
const functions = firebase.functions();
const storage = firebase.storage();

if (firebase.messaging.isSupported()) {
  messaging = firebase.messaging();
  messaging.usePublicVapidKey("BAKZFaJ-BRXiOD_-PIzqLcqwXOjqx0j5vEqW8CWYWfB9T7v7YK_o5fzR_LPi6LNx8U31YXxxPWHx_VBUQ6nmpJM");
}

firebase.firestore().enablePersistence()
    .catch((err) => {
      if (err.code === 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled
        // in one tab at a a time.
        // ...
        console.log("Multiple tabs open, persistence can only be enabled in one tab at a time.");
        window.alert("Multiple tabs open, persistence can only be enabled in one tab at a time.");
      } else if (err.code === 'unimplemented') {
        // The current browser does not support all of the
        // features required to enable persistence
        // ...
        console.log("The current browser does not support all of the features required to enable persistence");
        window.alert("The current browser does not support all of the features required to enable persistence");
      }
    });

export {firebase, messaging, functions, storage};

