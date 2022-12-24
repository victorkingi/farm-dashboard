import SHA256 from "crypto-js/sha256";

/**
 * will be affected only if amount > balance
 * @returns {function(*, *, {getFirebase: *, getFirestore: *}): void}
 * @param values
 */
export const sendMoney = (values) => {
    return (dispatch, getState, {getFirebase, getFirestore}) => {
        const firebase = getFirebase();
        const firestore = getFirestore();
        let newDate = values.date;
        newDate.setHours(0, 0, 0, 0);
        values.date = newDate;

        let hash = `${parseInt(values.date.getTime()/1000)}${values.amount}${values.from}${values.to}`.toUpperCase();
        hash = SHA256(hash).toString();
        values.submitted_on = new Date();

        if (values.receiver.startsWith("WITHDRAW")) {
            return firebase.auth().onAuthStateChanged(user => {
                if (user) {
                    return user.getIdTokenResult().then(idToken => {
                        if (!idToken.claims.admin) {
                            window.alert("You are not an admin");
                            return -1;
                        } else {
                            firestore.collection("pending_transactions").doc(hash).set({
                                values
                            });
                            dispatch({type: 'MONEY_SENT', values});
                        }
                    });
                }
            });
        } else {
            firestore.collection("pending_transactions").doc(hash).set({
                values
            });
            dispatch({type: 'MONEY_SENT', values});
        }
    }
}

/**
 *
 * @returns {function(*, *, {getFirebase: *, getFirestore: *}): void}
 * @param allKeys
 * @param isOne
 * @param isDebt
 * @param buyers
 * @param items
 * @param payers
 */
//if a customer has taken trays but hasn't paid, hasPaidLate fires
export const hasPaidLate = (allKeys, isOne, isDebt, buyers, items, payers) => {
    return (dispatch, getState, {getFirebase, getFirestore}) => {
        const firestore = getFirestore();
        const payersObj = {};
        let payerArray = Object.entries(payersObj);

        if (payers) {
            let x_ = payers.slice(0, -1);
            let payerNames_ = x_.split(',');
            for (const n of payerNames_) {
                payersObj[n.split(':')[0].toUpperCase()] = parseInt(n.split(':')[1]);
            }
            payerArray = Object.entries(payersObj);
        }
        if (!payers && !isDebt) {
            console.log("invalid arguments provided");
            window.alert("invalid arguments");
            return Promise.resolve(['fail']);
        }
        let allRes = [];

        for (const key of allKeys) {
            const res = firestore.collection("late_payment").doc(key)
                .get().then((doc) => {
                if (!doc.exists) {
                    console.log('late doc does not exist')
                    return 'late doc does not exist';
                }
                let val = {
                    ...doc.data()
                }
                val.values.paid_on = new Date()
                delete val.rejected;
                delete val.ready;
                delete val.signal;

                if (isDebt) {
                    val.values.pairing = {
                        buyers,
                        items
                    };
                    firestore.collection("pending_transactions").doc(key).set({ ...val });
                    dispatch({type: 'LATE_REPAID'});
                    doc.ref.delete();

                } else {
                    let keyField = 'paid_by';
                    let needed = parseInt(val.values.item_no) * parseInt(val.values.item_price);

                    if (val.values.category === 'sales') {
                        keyField = 'receiver';
                        needed = parseInt(val.values.tray_no) * parseInt(val.values.tray_price);
                    }

                    if (isOne) {
                        let prevPaid = val.values[keyField].slice(0, -1);
                        let payments = prevPaid.split(',');

                        for (let amt of payments) {
                            const kv = amt.split(':');
                            const name = kv[0].toUpperCase();
                            const val = parseInt(kv[1]);
                            if (Object.keys(payersObj).includes(name)) {
                                payersObj[name] += val;
                            }
                        }
                        val.values[keyField] = `${Object.entries(payersObj).map(item => `${item[0]}:${item[1]}`).join(',')},`;

                        const totalPaid = Object.values(payersObj).reduce((a, b) => a + b, 0);

                        if (totalPaid === needed) {
                            console.log("total paid", totalPaid);
                            firestore.collection("pending_transactions").doc(key).set({ ...val });
                            dispatch({type: 'LATE_REPAID'});
                            doc.ref.delete();

                        } else if (totalPaid > needed) {
                            console.log("overpaid", totalPaid, needed);
                            return `overpaid by Ksh.${totalPaid-needed}`;
                        } else {
                            delete val.values.paid_on;
                            if (val.values.hasOwnProperty('halfPaid')) val.values.halfPaid.push(...[val.values[keyField], new Date()]);
                            else val.values.halfPaid = [val.values[keyField], new Date()];
                            dispatch({type: 'LATE_REPAID'});

                            doc.ref.update({...val});
                        }
                    } else {
                        val.values[keyField] = '';
                        let i = 0;
                        while (needed !== 0) {
                            const prev = needed;
                            while (payerArray[i][1] === -1) {
                                i++;
                                if (payerArray.length <= i) {
                                    console.log("consumed all before full payment", payerArray);
                                    return 'consumed all before full payment';
                                }
                            }
                            needed -= payerArray[i][1];

                            if (needed >= 0) {
                                val.values[keyField] += `${payerArray[i][0].toUpperCase()}:${payerArray[i][1]},`;
                                payersObj[payerArray[i][0]] = -1;
                                payerArray[i][1] = -1;
                            }

                            if (needed < 0) {
                                val.values[keyField] += `${payerArray[i][0].toUpperCase()}:${prev},`;
                                payersObj[payerArray[i][0]] -= prev;
                                payerArray[i][1] -= prev;
                                needed = 0;
                            }
                            i++;
                        }
                        firestore.collection("pending_transactions").doc(key).set({ ...val });
                        dispatch({type: 'LATE_REPAID'});
                        doc.ref.delete();
                    }
                }
                return 'ok';
            });
            allRes.push(res);
        }
        return Promise.all(allRes);
    }
}
