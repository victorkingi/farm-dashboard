/**
 *
 * @param eggs
 * @returns {(function(*, *, {getFirebase: *, getFirestore: *}): void)|*}
 */
export const inputTray = (eggs) => {
    return (dispatch, getState, {getFirebase, getFirestore}) => {
        const firebase = getFirebase();
        const firestore = getFirestore();
        const disName = firebase.auth().currentUser.displayName;
        const name =  disName.substring(0, disName.lastIndexOf(" ")).toUpperCase();
        let values = {
            ...eggs,
            submittedBy: name,
            submittedOn: new Date()
        }
        let newDate = values.date_;
        newDate.setHours(0, 0, 0, 0);
        values.date_ = newDate.getTime();
        values.notUpdated = newDate.getTime();
        console.log(values);
        firestore.collection('eggs_collected').add({
            ...values
        });
    }
};
