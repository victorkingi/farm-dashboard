import Localbase from "localbase";
import SHA256 from "crypto-js/sha256";

export const inputDeadSick = (deadSick, image) => {
    return (dispatch, getState, {getFirebase, getFirestore}) => {
        //make async call to database
        const firestore = getFirestore();
        const firebase = getFirebase();
        const user = firebase.auth().currentUser.displayName;
        const name = user.substring(0, user.lastIndexOf(" ")).toUpperCase();

        let values = {
            ...deadSick,
            submitted_by: name,
            url: '',
            file_name: `${deadSick.section.toUpperCase()}_${image.name}`,
            submitted_on: new Date()
        }
        let newDate = values.date;
        newDate.setHours(0, 0, 0, 0);
        values.date = newDate;

        let hash = `${values.parent}3${values.subgroups}${parseInt(values.date.getTime()/1000)}${values.section}`;
        hash = hash.toUpperCase();
        console.log("hash", hash);
        hash = SHA256(hash).toString();
        console.log("hash to use", hash);

        const reader = new FileReader();
        const db = new Localbase('imageUpload');
        reader.addEventListener('load', () => {
            let view = new Uint8Array(reader.result);
            return db.collection('dead_sick').add({
                image: view,
                file_name: `${deadSick.section.toUpperCase()}_${image.name}`,
                time: new Date().getTime()
            }).then(() => {
                console.log("doc added to local");
                firestore.collection('farms').doc('0').collection('pending_upload').add({ values, hash });
            });
        });
        reader.readAsArrayBuffer(image);
    }
}
