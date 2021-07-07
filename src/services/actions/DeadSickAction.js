import Localbase from "localbase";

export const inputDeadSick = (deadSick, image) => {
    return (dispatch, getState, {getFirebase, getFirestore}) => {
        //make async call to database
        const firestore = getFirestore();
        const firebase = getFirebase();
        const user = firebase.auth().currentUser.displayName;
        const name = user.substring(0, user.lastIndexOf(" ")).toUpperCase();

        let values = {
            ...deadSick,
            submittedBy: name,
            submittedOn: new Date()
        }
        const reader = new FileReader();
        const db = new Localbase('imageUpload');
        reader.addEventListener('load', () => {
            let view = new Uint8Array(reader.result);
            db.collection('dead_sick').add({
                image: view,
                file_name: `DEAD_${image.name}`,
                ext: image.name.substring(image.name.lastIndexOf('.')+1),
                time: new Date().getTime()
            });
            firestore.collection('pending_upload')
                .add({
                    values,
                    upload_complete: false,
                    file_name: `DEAD_${image.name}`,
                    url: '',
                    submittedOn: new Date()
                });
        })
        reader.readAsArrayBuffer(image);
    }
}
