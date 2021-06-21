import {checkDate} from "./utilAction";

function makeid(l) {
    let text = "";
    const char_list = '!#$%&()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[]^_abcdefghijklmnopqrstuvwxyz{|}~';
    for (let i = 0; i < l; i++) {
        text += char_list.charAt(Math.floor(Math.random() * char_list.length));
    }
    return text;
}

function errorMessage(message) {
    const err = new Error(message);
    console.error(err.message);
    window.alert(err);
    window.location = '/';
    throw  err;
}

function parameterChecks(firestore, values) {
    if ((values.section === "THIKA_FARMERS" || values.section === "DUKA")
        &&  !JSON.parse(values.status)) {
        errorMessage("Thika Farmers and duka are always paid");
    }
    if (!values.section) {
        errorMessage("Section is empty!");
    }
    if (values.trayNo < 1 || values.trayPrice < 1) {
        errorMessage("Tray price and number cannot be negative / 0");
    }
    if (!values.name) errorMessage("User undefined!");
    checkDate(values.date);
    if (values.buyerName) {
        values.buyerName = values.buyerName.charAt(0).toUpperCase().concat(values
            .buyerName.substring(1));
    }
}

export const getSectionAddr = (section) => {
    let newSection = section.toUpperCase();
    const index = newSection.indexOf(' ');
    if (section === 'Other') return newSection.concat('_SALE');
    if (index < 0) return newSection;
    return newSection.substring(0, index).concat('_', newSection.substring(index+1))
}

/**
 * if other sales exists in pending_transactions, query and get total
 * trays sold, - from current trays and use the result as value
 * @param sales
 * @returns {function(*, *, {getFirebase: *, getFirestore: *}): void}
 */
export const inputSell = (sales) => {
    return (dispatch, getState, {getFirebase, getFirestore}) => {
        const firebase = getFirebase();
        const disName = firebase.auth().currentUser.displayName;
        const name =  disName.substring(0, disName.lastIndexOf(" ")).toUpperCase();
        const firestore = getFirestore();
        let status = true;
        if (sales.not_paid) {
            status = false;
        }
        const values = {
            ...sales,
            name,
            status,
            replaced: !!sales.replaced
        }
        delete values.not_paid;
        delete values.paid;
        values.category = 'sales';
        values.section = getSectionAddr(values.section);
        parameterChecks(firestore, values);
        if (JSON.parse(values.status)) {
            firestore.collection("pending_transactions").add({
                values: values,
                submittedOn: new Date()
            });
            dispatch({type: 'INPUT_SALES', sales});

        } else if (!JSON.parse(values.status)) {
            firestore.collection("late_payment").add({
                key: makeid(28),
                values,
                submittedOn: new Date()
            });
            dispatch({type: 'INPUT_SALES', values});
        } else {
            window.alert(new Error("UNKNOWN_ERROR"));
            throw new Error("UNKNOWN_ERROR");
        }
    }
}

export {makeid};
