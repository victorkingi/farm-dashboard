
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
export const inputSell = (values, isPending) => {
  return (dispatch, getState, {
    getFirebase,
    getFirestore
  }) => {
    const firestore = getFirestore();
    let newDate = values.date;
    newDate.setHours(0, 0, 0, 0);
    values.date = newDate;
    values.submitted_on = new Date();

    if (isPending) {
        firestore.collection("farms").doc("0").collection("pending")
        .add({
          values
        });

        firestore.collection('farms').doc('0').update({
            waiting: true
        });

        dispatch({
          type: 'INPUT_SALES',
          values
        });

      } else {
        firestore.collection('farms').doc('0').collection('ppending')
        .add({
          values
        });

        firestore.collection('farms').doc('0').update({
            waiting: true
        });

        dispatch({
          type: 'INPUT_SALES',
          values
        });
      }
  };
}
