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
            values.check_group = '0';
            firestore.collection('0').doc('misc').collection('pending')
                .add({
                create: true,
                values
            });
            firestore.collection('0').doc('config').update({
                waiting: true
            });
            dispatch({type: 'INPUT_BUYING', values});
        } else {
            values.check_group = '1';
            firestore.collection('0').doc('misc').collection('pending')
                .add({
                create: true,
                values
            });
            firestore.collection('0').doc('config').update({
                waiting: true
            });
            dispatch({
                type: 'INPUT_BUYING',
                values
            });
        }
    }
}
