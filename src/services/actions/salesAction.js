import SHA256 from "crypto-js/sha256";

export const getSectionAddr = (section) => {
  if (section === 'Cakes') return 'CAKES';
  if (section === 'Other Buyer') return 'SOTHER';
  if (section === 'Thika Farmers') return 'THIKA FARMERS';
  if (section === 'Duka') return 'DUKA';
  if (section === 'Feeds') return 'FEEDS';
  if (section === 'Drugs') return 'DRUGS';
  if (section === 'Pay Purity') return 'PPURITY';
  if (section === 'Other Expenses') return 'POTHER';
}

/**
 * if other sales exists in pending, query and get total
 * trays sold, - from current trays and use the result as value
 * @returns {function(*, *, {getFirebase: *, getFirestore: *}): void}
 * @param values
 */
export const inputSell = (values) => {
  return (dispatch, getState, {
    getFirebase,
    getFirestore
  }) => {
    const firestore = getFirestore();
    let newDate = values.date;
    newDate.setHours(0, 0, 0, 0);
    values.date = newDate;

    let hash = `${values.subgroups}${values.buyer_name}${parseInt(values.date.getTime()/1000)}`;
    console.log("hash", hash);
    hash = SHA256(hash).toString();
    values.submitted_on = new Date();

    if (JSON.parse(values.status)) {
        firestore.collection("farms").doc("0").collection("pending")
        .add({
          values,
          hash
        });

        firestore.collection('farms').doc('0').update({
            listener: firestore.FieldValue.increment(1)
        });

        dispatch({
          type: 'INPUT_SALES',
          values
        });

      } else {
        firestore.collection('farms').doc('0').collection('ppending')
        .add({
          values,
          hash
        });

        firestore.collection('farms').doc('0').update({
            listener: firestore.FieldValue.increment(1)
        });

        dispatch({
          type: 'INPUT_SALES',
          values
        });
      }
  };
}
