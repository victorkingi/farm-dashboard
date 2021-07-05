
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
        reader.addEventListener('load', () => {
            localStorage.setItem(`DEAD_${image.name}`, `${reader.result}`);
            firestore.collection('pending_upload')
                .add({
                    values,
                    upload_complete: false,
                    file_name: `DEAD_${image.name}`,
                    url: '',
                    submittedOn: new Date()
                });
        })
        reader.readAsDataURL(image);
    }
}
