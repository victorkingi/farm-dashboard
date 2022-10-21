/**
 * pending will affect iff borrower amount is < balance
 * @returns {function(*, *, {getFirebase: *, getFirestore: *}): void}
 * @param values
 */
export const moneyBorrowed = (values) => {
    return (dispatch, getState, {getFirebase, getFirestore}) => {
        const firestore = getFirestore();
        firestore.collection("pending_transactions").add({
            values,
            submittedOn: new Date()
        });
        dispatch({type: 'BORROW_SUCCESS'});
    }
}

/**
 * will be affected only if amount > balance
 * @returns {function(*, *, {getFirebase: *, getFirestore: *}): void}
 * @param values
 */
export const sendMoney = (values) => {
    return (dispatch, getState, {getFirebase, getFirestore}) => {
        const firebase = getFirebase();
        const firestore = getFirestore();

        if (values.receiver.startsWith("WITHDRAW")) {
            return firebase.auth().onAuthStateChanged(user => {
                if (user) {
                    return user.getIdTokenResult().then(idToken => {
                        if (!idToken.claims.admin) {
                            window.alert("You are not an admin");
                            return -1;
                        } else {
                            firestore.collection("pending_transactions").add({
                                values,
                                submittedOn: new Date()
                            });
                            dispatch({type: 'MONEY_SENT', values});
                        }
                    });
                }
            });
        } else {
            firestore.collection("pending_transactions").add({
                values,
                submittedOn: new Date()
            });
            dispatch({type: 'MONEY_SENT', values});
        }
    }
}

/**
 *
 * @returns {function(*, *, {getFirebase: *, getFirestore: *}): void}
 * @param key
 */
//if a customer has taken trays but hasn't paid, hasPaidLate fires
export const hasPaidLate = (key) => {
    return (dispatch, getState, {getFirebase, getFirestore}) => {
        const firebase = getFirebase();
        const displayName = firebase.auth().currentUser.displayName;
        const name = displayName.substring(0, displayName.lastIndexOf(" ")).toUpperCase();
        const firestore = getFirestore();

        return firestore.collection("late_payment").doc(key)
            .get().then((doc) => {
            if (!doc.exists) {
                console.log('late doc does not exist')
                return new Error("Entry does not exist");
            }
            doc.ref.delete();
            firestore.collection("pending_transactions").add({
                ...doc.data(),
                clearedBy: name,
                paidOn: new Date()
            });
            dispatch({type: 'LATE_REPAID'});
            return 'ok';
        });
    }
}
