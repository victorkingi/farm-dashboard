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

const setProperty = (obj, path, value) => {
    const [head, ...rest] = path.split('.')

    return {
        ...obj,
        [head]: rest.length
            ? setProperty(obj[head], rest.join('.'), value)
            : value
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
            let val = {
                ...doc.data(),
                paidOn: new Date()
            }
            val = setProperty(val, 'values.receiver', name);

            firestore.collection("pending_transactions").add(val);
            dispatch({type: 'LATE_REPAID'});
            doc.ref.delete();
            return 'ok';
        });
    }
}
