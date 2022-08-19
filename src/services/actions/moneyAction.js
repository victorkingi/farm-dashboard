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

/**
 *
 * @param details
 * @returns {function(*, *, {getFirebase: *, getFirestore: *}): void}
 */
//if a customer has taken trays but hasn't paid, hasPaidLate fires
export const hasPaidLate = (details) => {
    return (dispatch, getState, {getFirebase, getFirestore}) => {
        const firebase = getFirebase();
        const displayName = firebase.auth().currentUser.displayName;
        const name = displayName.substring(0, displayName.lastIndexOf(" ")).toUpperCase();
        const firestore = getFirestore();
        let values = {
            ...details,
            clearedBy: name,
            status: true
        }
        delete values.id;

        firestore.collection("late_payment").where("key", "==", details.key)
            .get().then((query) => {
            if (query.size !== 1) {
                window.alert(new Error("INVALID"));
                window.location.reload();
                throw new Error("INVALID");
            }
            query.forEach((doc) => {
                doc.ref.delete();
                firestore.collection("pending_transactions").add({
                    ...values,
                    submittedOn: new Date()
                });
                dispatch({type: 'LATE_REPAID'});
            })
        })
    }
}
