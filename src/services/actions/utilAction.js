import {messaging, storage} from "../api/fbConfig";

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

//gets key value pairs of all pending files
function allStorage() {
    let keys = Object.keys(localStorage);
    const keyPair = new Map();
    for (let k = 0; k < keys.length; k++) {
        if (keys[k].startsWith('DEAD_')) {
            keyPair.set(keys[k], localStorage.getItem(keys[k]));
        }
    }
    return keyPair;
}

function getExt(file) {
    return file.substring(file.lastIndexOf('.')+1);
}

export const uploadPending = () => {
    return (dispatch, getState, {getFirebase, getFirestore}) => {
        const firestore = getFirestore();
        const firebase = getFirebase();
        const storageRef = storage.ref();
        const keyPair = allStorage();

        keyPair.forEach((value, key) => {
            const uploadImagesRef = storageRef.child(`dead_sick/${key.substring(5)}`);
            const metadata = {
                contentType: `image/${getExt(key.substring(5))}`
            }
            const uploadTask = uploadImagesRef.putString(value, 'data_url', metadata);
            uploadTask.on('state_changed',
                function (snapshot) {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log("Upload is " + progress + " % done");
                    switch (snapshot.state) {
                        case firebase.storage.TaskState.PAUSED: // or 'paused'
                            console.log('Upload is paused');
                            break;
                        case firebase.storage.TaskState.RUNNING: // or 'running'
                            console.log('Upload is running');
                            break;
                        default:
                    }
                },
                function (error) {
                    switch (error.code) {
                        case 'storage/unauthorized':
                            window.alert("ERROR: You don't have permission to perform this task!");
                            break;
                        case 'storage/canceled':
                            window.alert("Upload successfully cancelled!");
                            break;
                        case 'storage/unknown':
                            window.alert("ERROR: Unknown error occurred!");
                            break;
                        default:
                    }
                },
                function () {
                    uploadTask.snapshot.ref.getDownloadURL().then(function (url) {
                        console.log('done')
                        firestore
                            .collection('pending_upload')
                            .where("file_name", "==", key)
                            .get().then((query) => {
                            if (query.size === 0) {
                                window.alert("UPLOADED FILE DOESN'T HAVE A DOC");
                                throw new Error("UPLOADED FILE DOESN'T HAVE A DOC");
                            } else if (query.size > 1) {
                                window.alert("MORE THAN ONE MATCH: "+query.size);
                                throw new Error("MORE THAN ONE MATCH: "+query.size);
                            }
                            query.forEach((doc) => {
                                doc.ref.update({
                                    url
                                }).then(() => {
                                    localStorage.removeItem(key);
                                });
                            });
                        })
                    })
                });
        })
    }
}

// undo write events to database
export const rollBack = (state) => {
    return (dispatch, getState, {getFirebase, getFirestore}) => {
        const firestore = getFirestore();
        for (let i = 0; i < state.length; i++) {
            firestore.collection("pending_transactions").doc(state[i])
                .get().then((doc) => {
                if (doc.exists) {
                    doc.ref.delete();
                } else {
                    const err = new Error("Invalid data!");
                    console.error(err.message);
                     window.alert(err);
                     window.location.reload();
                    throw err;
                }
            })
        }
    }
}

export const handleToken = (sendTokenToServer_) => {
    const load = document.getElementById("loading");
    const submit = document.getElementById("login");

    if (messaging !== null) {
        messaging.requestPermission()
            .then(async function () {
                const token = await messaging.getToken();
                sendTokenToServer_(token);
            })
            .catch(function (err) {
                console.log("Unable to get permission to notify.", err);
                window.alert(`ERROR: ${err}`);
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
    } else {
        window.alert("ERROR: This browser does not support push notifications, please uncheck the box");
        load.style.display = 'none';
        submit.style.display = 'block';
    }
}
