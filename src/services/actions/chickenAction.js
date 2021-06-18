import {functions} from "../api/firebase configurations/fbConfig";

export const sendTokenToServer = (token) => {
    return (dispatch, getState, {getFirestore, getFirebase}) => {

        const firestore = getFirestore();
        const firebase = getFirebase();
        const batch = firestore.batch();
        const fullName = firebase.auth().currentUser.displayName;
        const name = fullName.substring(0, fullName.lastIndexOf(" ")).toUpperCase();
        const email = firebase.auth().currentUser.email;

        if (name) {
            const docRef = firestore.collection("notify_token").doc(name);
            const tokenRef = docRef.collection("tokens").doc(token);
            const checkCount = docRef.collection("tokens").doc("count");
            checkCount.get().then((doc) => {
                if (!doc.exists) {
                    batch.set(checkCount, {
                        total: 0,
                        submittedOn: new Date()
                    });
                }
                batch.set(docRef, {
                    submittedOn: new Date()
                });
                batch.set(tokenRef, {
                    token,
                    email,
                    submittedOn: new Date()
                });

                batch.commit().then(() => {
                    console.log("new token");
                    const firstNotification = functions.httpsCallable('util-enabledNotify');
                    firstNotification({token}).then(() => {
                        window.location.reload();
                    }).catch((err) => {
                        window.alert(`ERROR: Unexpected error occurred! ${err}`);
                    });
                }).catch((err) => {
                    console.log("entered: ", err.message);
                    window.alert(`ERROR: ${err.message} If you are already subscribed to notifications, please uncheck box and click submit to proceed. If after doing this you are still seeing this error, contact admin for help`);
                    const load = document.getElementById("loading");
                    const submit = document.getElementById("login");
                    load.style.display = 'none';
                    submit.style.display = 'block';
                });
            }).catch((err) => {
                console.log("entered: ", err.message);
                window.alert(`ERROR: ${err.message}. Failed to subscribe!`);
                const load = document.getElementById("loading");
                const submit = document.getElementById("login");
                load.style.display = 'none';
                submit.style.display = 'block';
            });
        }
    }
}