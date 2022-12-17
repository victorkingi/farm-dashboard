import SHA256 from "crypto-js/sha256";

/**
 *
 * @returns {function(*, *, {getFirebase: *, getFirestore: *}): void}
 * @param values
 */
export const inputPurchase = (values) => {
    return (dispatch, getState, {getFirebase, getFirestore}) => {
        const firestore = getFirestore();
        console.log(values);
        let newDate = values.date;
        newDate.setHours(0, 0, 0, 0);
        values.date = newDate;

        let hash = `${values.itemName}${parseInt(values.date.getTime()/1000)}${values.section}`.toUpperCase();
        hash = SHA256(hash).toString();

        if (JSON.parse(values.status)) {
            firestore.collection("pending_transactions").add({
                values,
                hash,
                submittedOn: new Date()
            });
            dispatch({type: 'INPUT_BUYING', values});
        } else {
            firestore.collection('late_payment')
                .add({
                    values,
                    hash,
                    submittedOn: new Date()
                });
            dispatch({
                type: 'INPUT_BUYING',
                values
            });
        }
    }
}
