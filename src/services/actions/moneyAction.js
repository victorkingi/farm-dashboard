/**
 * will be affected only if amount > balance
 * @returns {function(*, *, {getFirebase: *, getFirestore: *}): void}
 * @param values
 */
export const sendMoney = (values) => {
    return (dispatch, getState, {getFirebase, getFirestore}) => {
        const firebase = getFirebase();
        const firestore = getFirestore();
        let newDate = values.date;
        newDate.setHours(0, 0, 0, 0);
        values.date = newDate;

        values.submitted_on = new Date();
        values.subgroups = '0::0;1::0';
        values.check_group = '0';

        if (values.receiver.startsWith("WITHDRAW")) {
            firebase.auth().onAuthStateChanged(user => {
                if (user) {
                    return user.getIdTokenResult().then(idToken => {
                        if (!idToken.claims.admin) {
                            window.alert("You are not an admin");
                            return -1;
                        } else {
                            firestore.collection('farms').doc('0').collection('pending')
                            .add({
                                create: true,
                                values
                            });
                            firestore.collection('farms').doc('0').update({
                                waiting: true
                            });
                            dispatch({type: 'MONEY_SENT', values});
                        }
                    });
                }
            });
        } else {
            firestore.collection('farms').doc('0').collection('pending')
            .add({
                create: true,
                values
            });
            firestore.collection('farms').doc('0').update({
                waiting: true
            });
            dispatch({type: 'MONEY_SENT', values});
        }
    }
}

/**
 *
 * @returns {function(*, *, {getFirebase: *, getFirestore: *}): void}
 * @param allKeys
 */
//if a customer has taken trays but hasn't paid, hasPaidLate fires
export const hasPaidLate = (allKeys) => {
    return (dispatch, getState, {getFirebase, getFirestore}) => {
        const firestore = getFirestore();
        let allRes = [];

        for (const key of allKeys) {
            const res = firestore.collection('farms').doc('0').collection("pending").doc(key)
                .get().then((doc) => {
                    if (!doc.exists) {
                        console.log('late doc does not exist')
                        return 'late doc does not exist';
                    }
                    let val = {
                        ...doc.data()
                    }

                    if (val.values?.check_group !== '1') {
                        console.log('Invalid check_group');
                        return 'Invalid check_group';
                    }

                    delete val.rejected;
                    delete val.ready;
                    delete val.signal;

                    firestore.collection('farms').doc('0').collection('pending')
                    .add({ ...val });

                    firestore.collection('farms').doc('0').update({
                        waiting: true
                    });

                    dispatch({type: 'LATE_REPAID'});
                    doc.ref.delete();

                    return 'ok';
                });
            allRes.push(res);
        }
        return Promise.all(allRes);
    }
}
