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

function parameterChecks(firestore, count, values) {
    if (values.buyerName && (values.section === "THIKA_FARMERS" || values.section === "DUKA"
        || values.section === "CAKES")) {
        errorMessage("Thika Farmers, Duka and Cakes don't require buyer name");
    }
    if ((values.section === "THIKA_FARMERS" || values.section === "DUKA")
        &&  !JSON.parse(values.status)) {
        errorMessage("Thika Farmers and duka are always paid");
    }
    if (!values.section) {
        errorMessage("Section is empty!");
    }
    if (count % 2 !== 0) {
        errorMessage("Functionality not yet implemented!");
    }
    if (values.trayNo < 1 || values.trayPrice < 1) {
        errorMessage("Tray price and number cannot be negative / 0");
    }
    if (!values.name) errorMessage("User undefined!");
    delete values.error_doc;
    checkDate(values.date);
    if (values.buyerName) {
        values.buyerName = values.buyerName.charAt(0).toUpperCase().concat(values
            .buyerName.substring(1));
    }
}

/**
 * if other sales exists in pending_transactions, query and get total
 * trays sold, - from current trays and use the result as value
 * @param sales
 * @param date
 * @param renderCount
 * @returns {function(*, *, {getFirebase: *, getFirestore: *}): void}
 */
export const inputSell = (sales, date, renderCount) => {
    return (dispatch, getState, {getFirebase, getFirestore}) => {
        const firebase = getFirebase();
        const disName = firebase.auth().currentUser.displayName;
        const name =  disName.substring(0, disName.lastIndexOf(" ")).toUpperCase();
        const firestore = getFirestore();
        const values = {
            ...sales,
            date,
            name,
            replaced: "false"
        }
        parameterChecks(firestore, renderCount, values);
        if (JSON.parse(values.status)) {
            firestore.collection("pending_transactions").add({
                values: values,
                submittedOn: new Date()
            });
            dispatch({type: 'INPUT_SALES', sales});
            window.alert("Data Submitted");
            const load = document.getElementById("loading-sales");
            const submit = document.getElementById("submit-btn-sales");
            load.style.display = 'none';
            submit.style.display = 'block';

        } else if (!JSON.parse(values.status)) {
            firestore.collection("late_payment").add({
                key: makeid(28),
                values,
                submittedOn: new Date()
            });
            dispatch({type: 'INPUT_SALES', sales});
            window.alert("Data Submitted");
            const load = document.getElementById("loading-sales");
            const submit = document.getElementById("submit-btn-sales");
            load.style.display = 'none';
            submit.style.display = 'block';
        } else {
            window.alert(new Error("UNKNOWN_ERROR"));
            throw new Error("UNKNOWN_ERROR");
        }
    }
}

export {makeid};
