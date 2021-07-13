function getDateString(myDate) {
    myDate.setDate(myDate.getDate() + 20);
    return ('0' + myDate.getDate()).slice(-2) + '/'
        + ('0' + (myDate.getMonth()+1)).slice(-2) + '/'
        + myDate.getFullYear();
}
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
        return firestore.doc('bags/predicted_bags')
            .get().then((doc) => {
                const data = doc.data();
                const str = data.trend;
                let p = str.split(';');
                let dates = p[0];
                let values = p[1];
                dates = dates.split(',');
                values = values.split(',');
                dates.push(getDateString(new Date(values.date_)));
                values.push(values.bags_store);
                let trend = dates.toString()+';'+values.toString();
                doc.ref.update({trend}).then(() => {
                    delete values.bags_store;
                    console.log(values);
                    firestore.collection('eggs_collected').add({
                        ...values
                    });
                    console.log('done');
                });
            });
    }
};
