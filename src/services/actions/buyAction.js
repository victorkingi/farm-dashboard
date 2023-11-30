import SHA256 from "crypto-js/sha256";

/**
 *
 * @returns {function(*, *, {getFirebase: *, getFirestore: *}): void}
 * @param values
 */
export const inputExpense = (values) => {
    return (dispatch, getState, {getFirebase, getFirestore}) => {
        const firestore = getFirestore();
        console.log(values);
        let newDate = values.date;
        newDate.setHours(0, 0, 0, 0);
        values.date = newDate;

        let hash = `${values.parent}2${values.subgroups}${parseInt(values.date.getTime()/1000)}${values.item_name}`;
        console.log("hash", hash);
        hash = SHA256(hash).toString();
        values.submitted_on = new Date();
        console.log("hash to use", hash);
        
        if (JSON.parse(values.status)) {
            firestore.collection('farms').doc('0').collection('pending')
                .add({
                values,
                hash
            });
            firestore.collection('farms').doc('0').update({
                waiting: true
            });
            dispatch({type: 'INPUT_BUYING', values});
        } else {
            firestore.collection('farms').doc('0').collection('ppending')
                .add({
                values,
                hash
            });
            firestore.collection('farms').doc('0').update({
                waiting: true
            });
            dispatch({
                type: 'INPUT_BUYING',
                values
            });
        }
    }
}
