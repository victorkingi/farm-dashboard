import {checkDate} from "./utilAction";


function errorMessage(message) {
    const err = new Error(message);
    console.error(err.message);
    window.alert(err);
    window.location = '/';
    throw  err;
}

function parameterChecks(firestore, count, values) {
    if (values.borrower === values.get_from) {
        errorMessage("Cannot borrow and get from yourself!");
    }
    if (values.purpose === "" || !values.purpose) {
        errorMessage("Purpose cannot be empty");
    }
    if (values.amount < 1) {
        errorMessage("Invalid amount!");
    }
    if (count % 2 !== 0) {
        errorMessage("Functionality not yet implemented!");
    }
    delete values.error_doc;
    if (!values.name) errorMessage("User undefined!");
    checkDate(values.date);
}

function parameterSendingChecks(firestore, values) {
    if (values.name === values.receiver) {
        errorMessage("Cannot send money to yourself!");
    }
    if (values.amount < 1) {
        errorMessage("Invalid amount!");
    }
    if (!values.name) errorMessage("Sender undefined!");
    if (!values.initiator) errorMessage("User undefined!");

    delete values.error_doc;
}

/**
 * pending will affect iff borrower amount is < balance
 * @param borrow
 * @param date
 * @param renderCount
 * @returns {function(*, *, {getFirebase: *, getFirestore: *}): void}
 */
export const moneyBorrowed = (borrow, date, renderCount) => {
    return (dispatch, getState, {getFirebase, getFirestore}) => {
        const firestore = getFirestore();
        const firebase = getFirebase();
        const disName = firebase.auth().currentUser.displayName;
        const name =  disName.substring(0, disName.lastIndexOf(" ")).toUpperCase();
        let values = {
            ...borrow,
            date,
            name,
            replaced: "false"
        }
        parameterChecks(firestore, renderCount, values);
        firestore.collection("pending_transactions").add({
            values,
            submittedOn: new Date()
        });
        dispatch({type: 'BORROW_SUCCESS'});
        window.alert("Data Submitted");
        const load = document.getElementById("loading-borrow");
        const submit = document.getElementById("submit-btn-borrow");
        load.style.display = 'none';
        submit.style.display = 'block';
    }
}

const cleanSendReceive = (str, name) => {
    let str1 = str.toUpperCase();
    if (str.includes('From')) return str1.slice(4);
    else if (str.includes('To')) return str1.slice(2);
    else if (str.includes('Me')) return name;
    return str1;
}

/**
 * will be affected only if amount > balance
 * @param money
 * @returns {function(*, *, {getFirebase: *, getFirestore: *}): void}
 */
export const sendMoney = (money) => {
    return (dispatch, getState, {getFirebase, getFirestore}) => {
        const firebase = getFirebase();
        const user = firebase.auth().currentUser.displayName;
        const name = user.substring(0, user.lastIndexOf(" ")).toUpperCase();
        const firestore = getFirestore();
        let values = {
            ...money,
            name: money.from,
            receiver: money.to,
            initiator: name
        }
        delete values.from;
        delete values.to;
        values.receiver = cleanSendReceive(values.receiver, name);
        values.name = cleanSendReceive(values.name, name);
        values.initiator = cleanSendReceive(values.initiator, name);
        console.log(values);

        if (values.receiver === values.name) {
            const err = new Error("Cannot send money to yourself!");
            window.alert(err);
            console.error(err);
            window.location.reload();
            throw err;
        }
        if (parseFloat(values.amount) < 1) {
            const err = new Error("Invalid amount!");
            window.alert(err);
            console.error(err);
            window.location.reload();
            throw err;
        }

        if (values.receiver === "BANK") {
            return firebase.auth().onAuthStateChanged(user => {
                if (user) {
                    return user.getIdTokenResult().then(idToken => {
                        if (!idToken.claims.admin) {
                            return Promise.reject("ERROR: You are not an admin!");
                        } else {
                            parameterSendingChecks(firestore, values);
                            firestore.collection("pending_transactions").add({
                                values,
                                submittedOn: new Date()
                            });
                            dispatch({type: 'MONEY_SENT', values});
                        }
                    }).catch((err) => {
                        console.error(err);
                        window.alert(err);
                        window.location = '/';
                    })
                }
            });
        } else {
            parameterSendingChecks(firestore, values);
            firestore.collection("pending_transactions").add({
                values,
                submittedOn: new Date()
            });
            dispatch({type: 'MONEY_SENT', money});
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
                    const load = document.getElementById(`load${details.id}`);
                    const submit = document.getElementById(`submit${details.id}`);
                    load.style.display = 'none';
                    submit.style.display = 'block';
                })
            })
    }
}
