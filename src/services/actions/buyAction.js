/**
 *
 * @returns {function(*, *, {getFirebase: *, getFirestore: *}): void}
 * @param values
 */
export const inputPurchase = (values) => {
    return (dispatch, getState, {getFirebase, getFirestore}) => {
        const firestore = getFirestore();
        console.log(values);
        if (JSON.parse(values.status)) {
            firestore.collection("pending_transactions").add({
                values,
                submittedOn: new Date()
            });
            dispatch({type: 'INPUT_BUYING', values});
        } else {
            firestore.collection('late_payment')
                .add({
                    values,
                    submittedOn: new Date()
                });
            dispatch({
                type: 'INPUT_BUYING',
                values
            });
        }
    }
}
