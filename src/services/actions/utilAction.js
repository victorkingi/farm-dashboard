import {messaging} from "../api/firebase configurations/fbConfig";

export const hideBars = () => {
    return (dispatch) => {
        dispatch({type: 'HIDE_BARS'});
    }
}

export const sanitize_string = (str) => {
    let str_1 = str.toUpperCase().charAt(0).concat(str.toLowerCase().slice(1));
    str_1 = str_1.includes('_') ? str_1.replace('_', ' ') : str_1;
    let str_2 = str_1.includes(' ') ? str_1.substring(str_1.lastIndexOf(' ')+1) : null;
    str_2 = str_2 !== null ? str_2.toUpperCase().charAt(0).concat(str_2.toLowerCase().slice(1)) : null;
    if (str_2 !== null) {
        str_1 = str_1.substring(0, str_1.lastIndexOf(" ")).concat(" ").concat(str_2);
    }
    return str_1
}

export const checkDate = (date) => {
    if (date.getTime() > new Date().getTime()) {
        const err = new Error("Invalid date!");
        console.error(err.message);
        window.alert(err);
        throw err;
    } else {
        return true;
    }
}

// undo write events to database
export const rollBack = (details) => {
    return (dispatch, getState, {getFirebase, getFirestore}) => {
        const firestore = getFirestore();
        firestore.collection("pending_transactions").doc(details.id)
            .get().then((doc) => {
                if (doc.exists) {
                    doc.ref.delete();
                } else {
                    const err = new Error("Invalid data!");
                    console.error(err.message);
                   // window.alert(err);
                  //  window.location.reload();
                    return null;
                }
        })
    }
}

export const handleToken = (sendTokenToServer_, renderCount) => {
    const load = document.getElementById("loading");
    const submit = document.getElementById("login");

    if (renderCount % 2 !== 0 && messaging !== null) {
        messaging.requestPermission()
            .then(async function () {
                const token = await messaging.getToken();
                sendTokenToServer_(token);
            })
            .catch(function (err) {
                console.log("Unable to get permission to notify.", err);
                window.alert("ERROR: It seems that your browser has blocked notifications. Try changing your option in settings for this site or rather, uncheck the checkbox to continue");

                load.style.display = 'none';
                submit.style.display = 'block';
            });
        messaging.onTokenRefresh(() => {
            messaging.getToken().then((refreshedToken) => {
                console.log('Token refreshed.');
                sendTokenToServer_(refreshedToken);
            }).catch((err) => {
                console.log('Unable to retrieve refreshed token ', err);
                window.alert(`ERROR: unable to retrieve messaging token ${err} uncheck box to continue`);
            });
        });
    } else if (messaging === null && renderCount % 2 !== 0 ) {
        window.alert("ERROR: This browser does not support push notifications, please uncheck the box");
        load.style.display = 'none';
        submit.style.display = 'block';
    }
    else {
        window.location.reload();
    }
}
