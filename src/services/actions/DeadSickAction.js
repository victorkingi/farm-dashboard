import Localbase from "localbase";

export const inputDeadSick = (deadSick, image) => {
    return (dispatch, getState, {getFirebase, getFirestore}) => {
        //make async call to database
        const firestore = getFirestore();

        let values = {
            ...deadSick,
            image_url: '',
            image_id: `${deadSick.state.toUpperCase()}_${image.name}`,
            submitted_on: new Date(),
            check_group: '0'
        }
        let newDate = values.date;
        newDate.setHours(0, 0, 0, 0);
        values.date = newDate;

        const reader = new FileReader();
        const db = new Localbase('imageUpload');
        reader.addEventListener('load', () => {
            let view = new Uint8Array(reader.result);
            return db.collection('dead_sick').add({
                image: view,
                file_name: `${deadSick.state.toUpperCase()}_${image.name}`,
                time: new Date().getTime()
            }).then(() => {
                console.log("doc added to local");
                firestore.collection('farms').doc('0').collection('pending_upload').add({ create: true, values });
            });
        });
        reader.readAsArrayBuffer(image);
    }
}
