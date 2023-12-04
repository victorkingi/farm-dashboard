import SHA256 from "crypto-js/sha256";
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
            submitted_by: name,
            submitted_on: new Date()
        }
        let newDate = values.date_;
        newDate.setHours(0, 0, 0, 0);
        values.date = newDate;
        delete values.date_;

        let hash = `${values.parent}4${values.subgroups}${parseInt(values.date.getTime()/1000)}`;
        hash = hash.toUpperCase();
        console.log("hash", hash);
        hash = SHA256(hash).toString();
        console.log("hash to use", hash);

        firestore.collection('farms').doc('0').collection('pending')
        .add({
            values,
            hash
        });
        firestore.collection('farms').doc('0').update({
            waiting: true
        });
        console.log('done');
    }
};
