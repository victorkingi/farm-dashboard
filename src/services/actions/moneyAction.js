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

        if (values.receiver === "BANK") {
            return firebase.auth().onAuthStateChanged(user => {
                if (user) {
                    return user.getIdTokenResult().then(idToken => {
                        if (!idToken.claims.admin) {
                            return Promise.reject("ERROR: You are not an admin!");
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
