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

        let hash = `${values.subgroups}${values.item_name}${parseInt(values.date.getTime()/1000)}`;
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
                listener: firestore.FieldValue.increment(1)
            });
            dispatch({type: 'INPUT_BUYING', values});
        } else {
            firestore.collection('farms').doc('0').collection('ppending')
                .add({
                values,
                hash
            });
            firestore.collection('farms').doc('0').update({
                listener: firestore.FieldValue.increment(1)
            });
            dispatch({
                type: 'INPUT_BUYING',
                values
            });
        }
    }
}
