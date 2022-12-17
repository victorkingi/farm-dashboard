import SHA256 from "crypto-js/sha256";

export const getSectionAddr = (section) => {
  if (section === 'Cakes') return 'CAKES';
  if (section === 'Other Buyer') return 'SOTHER';
  if (section === 'Thika Farmers') return 'THIKA FARMERS';
  if (section === 'Duka') return 'DUKA';
  if (section === 'Feeds') return 'FEEDS';
  if (section === 'Drugs') return 'DRUGS';
  if (section === 'Pay Purity') return 'PPURITY';
  if (section === 'Other Purchase') return 'POTHER';
}

/**
 * if other sales exists in pending_transactions, query and get total
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

    let hash = `${values.buyerName}${parseInt(values.date.getTime()/1000)}${values.section}`.toUpperCase();
    hash = SHA256(hash).toString();

    if (JSON.parse(values.status)) {
      firestore.collection('pending_transactions')
          .add({
            values,
            hash,
            submittedOn: new Date()
          });
        dispatch({
          type: 'INPUT_SALES',
          values
        });

      } else {
        firestore.collection('late_payment')
          .add({
            values,
            hash,
            submittedOn: new Date()
          });
        dispatch({
          type: 'INPUT_SALES',
          values
        });
      }
  };
}
