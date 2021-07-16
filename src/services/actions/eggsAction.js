function getDateString(myDate) {
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
                let bags_data = p[1];
                dates = dates.split(',');
                bags_data = bags_data.split(',');
                dates.push(getDateString(new Date(parseInt(values.date_))).toString());
                bags_data.push(values.bags_store.toString());
                let trend = dates.toString()+';'+bags_data.toString();
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
