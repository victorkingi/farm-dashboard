/**
 *
 * @param eggs
 * @returns {(function(*, *, {getFirebase: *, getFirestore: *}): void)|*}
 */
export const inputTray = (eggs) => {
    return (dispatch, getState, {getFirebase, getFirestore}) => {
        const firestore = getFirestore();
        let values = {
            ...eggs,
            submitted_on: new Date()
        }
        let newDate = values.date_;
        newDate.setHours(0, 0, 0, 0);
        values.date = newDate;
        delete values.date_;

        firestore.collection('farms').doc('0').collection('pending')
        .add({
            values
        });
        firestore.collection('farms').doc('0').update({
            waiting: true
        });
        console.log('done');
    }
};
