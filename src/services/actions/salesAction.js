export const getSectionAddr = (section) => {
  if (section === 'Cakes') return 'CAKES';
  if (section === 'Other Buyer') return 'SOTHER';
  if (section === 'Thika Farmers') return 'THIKAFARMERS';
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
    if (JSON.parse(values.status)) {
      firestore.collection('pending_transactions')
          .add({
            values: values,
            submittedOn: new Date()
          });
        dispatch({
          type: 'INPUT_SALES',
          values
        });

      } else if (!JSON.parse(values.status)) {
        firestore.collection('late_payment')
          .add({
            values,
            submittedOn: new Date()
          });
        dispatch({
          type: 'INPUT_SALES',
          values
        });
      }
  };
}
