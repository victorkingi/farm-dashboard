import {storage} from "../api/firebase configurations/fbConfig";
import {checkDate} from "./utilAction";

function errorMessage(message) {
    const err = new Error(message);
    console.error(err.message);
    window.alert(err);
    window.location = '/';
    throw  err;
}

async function parameterChecks(firestore, values, image) {
    const deadSick = await firestore.collection('dead_sick')
        .orderBy("submittedOn", "desc").get();
    const chicken = await firestore.collection("chicken_details")
        .doc("current").get();
    const chickenTotal = parseInt(chicken.data().total);
    let found = false;

    if (chickenTotal < parseInt(values.total)) {
        errorMessage("Chickens less than zero");
    }

    if (!image) {
        const error = new Error("No Image given!");
        window.alert(error);
        throw error;
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
        errorMessage("Duplicate data!");
    }
    checkDate(values.date);
}

export const inputDeadSick = (deadSick, image) => {
    return (dispatch, getState, {getFirebase, getFirestore}) => {
        //make async call to database
        const firestore = getFirestore();
        const firebase = getFirebase();
        const user = firebase.auth().currentUser.displayName;
        const name = user.substring(0, user.lastIndexOf(" ")).toUpperCase();
        const section = deadSick.section;
        const deadSickDocRef = firestore.collection("dead_sick").doc();
        const chickenDocRef = firestore.collection("chicken_details").doc("current");

        let values = {
            ...deadSick,
            submittedBy: name,
            submittedOn: new Date()
        }
        parameterChecks(firestore, values, image)
            .then(() => {
                const storageRef = storage.ref();
                const uploadImagesRef = storageRef.child(`dead_sick/${image?.name}`);
                const metadata = {
                    section
                }
                const uploadTask = uploadImagesRef.put(image, metadata);

                uploadTask.on('state_changed',
                    function (snapshot) {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        console.log("Upload is " + progress + " % done");
                    }, function (error) {
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
                            const batch = firestore().batch();

                            if (section === "Dead" ) {
                                batch.update(chickenDocRef, {
                                    house: firestore.FieldValue.increment(parseInt(deadSick.chickenNo * -1))
                                });

                                batch.update(chickenDocRef, {
                                    total: firestore.FieldValue.increment(parseInt(deadSick.chickenNo * -1)),
                                    submittedOn: new Date()
                                })
                                batch.set(deadSickDocRef, {
                                    ...deadSick,
                                    imageId: `dead_sick/${image?.name}`,
                                    photoURL: url,
                                    submittedBy: name,
                                    submittedOn: new Date()
                                });
                            }
                            batch.commit();
                            }).catch((err) => {
                                const error = err.message || err;
                                dispatch({type: 'UPLOAD_ERROR', error});
                                window.alert(error);
                                window.location = '/';
                            });
                        })
                    });
    }
}
