function makeid(l) {
    let text = "";
    const char_list = '!#$%&()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[]^_abcdefghijklmnopqrstuvwxyz{|}~';
    for (let i = 0; i < l; i++) {
        text += char_list.charAt(Math.floor(Math.random() * char_list.length));
    }
    return text;
}

export const getSectionAddr = (section) => {
    let newSection = section.toUpperCase();
    const index = newSection.indexOf(' ');
    if (section === 'Other Buyer') return newSection.substring(0, 5).concat('_SALE');
    else if (section === 'Other Purchase') return newSection.substring(0, 5).concat('_BUY');
    else if (section === 'Purity') return 'OTHER_PURITY';
    if (index < 0) return newSection;
    return newSection.substring(0, index).concat('_', newSection.substring(index+1))
}

/**
 * if other sales exists in pending_transactions, query and get total
 * trays sold, - from current trays and use the result as value
 * @returns {function(*, *, {getFirebase: *, getFirestore: *}): void}
 * @param values
 */
export const inputSell = (values) => {
    return (dispatch, getState, {getFirebase, getFirestore}) => {
        const firestore = getFirestore();
        console.log(values)
        if (JSON.parse(values.status)) {
            firestore.collection("pending_transactions").add({
                values: values,
                submittedOn: new Date()
            });
            dispatch({type: 'INPUT_SALES', values});

        } else if (!JSON.parse(values.status)) {
            firestore.collection("late_payment").add({
                key: makeid(28),
                values,
                submittedOn: new Date()
            });
            dispatch({type: 'INPUT_SALES', values});
        }
    }
}

export {makeid};
