import {checkDate} from "./utilAction";
import {getSectionAddr} from "./salesAction";

function errorMessage(message) {
    const err = new Error(message);
    console.error(err.message);
    window.alert(err);
    window.location = '/';
    throw  err;
}

function parameterChecks(firestore, values) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    if (values.itemName) {
        values.itemName = values.itemName.charAt(0).toUpperCase().concat(values
            .itemName.substring(1));
    }
    if (values.itemName && values.section === "OTHER_PURITY") {
        const regex = /^([A-Z][a-z]{2},)+$/gm;
        if (!regex.test(values.itemName)) {
            errorMessage("Item name should be of this format [Month,Month] i.e. Jan,Feb");
        } else {
            const enteredMonths = values.itemName.split(',');
            const found = [];
            for (let i = 0; i < enteredMonths.length; i++) {
                for (let p = 0; p < months.length; p++) {
                    if (enteredMonths[i] === months[p]) {
                        found.push(enteredMonths[i]);
                    }
                }
            }
            if (found.length+1 !== enteredMonths.length) {
                errorMessage("Item name should be of this format [Month,Month] i.e. Jan,Feb");
            }
            if (found.length !== parseInt(values.objectNo) || parseInt(values.objectNo) > 12) {
                errorMessage("Item name should be of this format [Month,Month] i.e. Jan,Feb and object number should be equal to number of months.");
            }
        }
    } else if (!values.section) {
        errorMessage("Section cannot be empty!");
    }
    if (!values.name) errorMessage("User undefined!");
    checkDate(values.date);
}

/**
 *
 * @param buys
 * @returns {function(*, *, {getFirebase: *, getFirestore: *}): void}
 */
export const inputPurchase = (buys) => {
    return (dispatch, getState, {getFirebase, getFirestore}) => {
        const firestore = getFirestore();
        const user = getFirebase().auth().currentUser.displayName;
        const name = user.substring(0, user.lastIndexOf(" ")).toUpperCase();
        if (name !== "VICTOR") {
            window.alert("ERROR: Untick replace wrong entry!");
            throw new Error("Untick wrong entry!");
        }
        let values = {
            ...buys,
            name,
            replaced: !!buys.replaced
        };
        values.section = getSectionAddr(values.section);
        let date = new Date(values.date);
        date.setHours(0,0,0,0);
        values.date = date;
        parameterChecks(firestore, values);
        console.log(values)
        firestore.collection("pending_transactions").add({
            values,
            submittedOn: new Date()
        });
        dispatch({type: 'INPUT_BUYING', values});
    }
}
