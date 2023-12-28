/**
 *
 * @returns {function(*, *, {getFirebase: *, getFirestore: *}): void}
 * @param values
 */
export const inputExpense = (values, isPending) => {
    return (dispatch, getState, {getFirebase, getFirestore}) => {
        const firestore = getFirestore();
        console.log(values);
        let newDate = values.date;
        newDate.setHours(0, 0, 0, 0);
        values.date = newDate;
        values.submitted_on = new Date();

        if (isPending) {
            firestore.collection('farms').doc('0').collection('pending')
                .add({
                values
            });
            firestore.collection('farms').doc('0').update({
                waiting: true
            });
            dispatch({type: 'INPUT_BUYING', values});
        } else {
            firestore.collection('farms').doc('0').collection('ppending')
                .add({
                values
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
