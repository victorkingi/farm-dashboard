const admin = require('firebase-admin');
const functions = require('firebase-functions');
const { SHA512 } = require('./constants');
const nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');

const {
    makeANotification,
    makeANotificationToOneUser,
    createNotification,
    borrowInput, buyInput, saleInput,
    errorMessage
} = require('./helper');
const numeral = require('numeral');

const runtimeOpt = {
    timeoutSeconds: 180
}

exports.updateWithdrawn = functions.firestore
    .document('current/{curId}')
    .onUpdate(((change, context) => {
        const docId = context.params.curId;
        if (!docId.startsWith('WITHDRAW_')) return 0;
        const data = change.after.exists ? change.after.data() : false;
        const beforeData = change.before.exists ? change.before.data() : false;
        if (data.balance === beforeData.balance) return 0;
        const user = docId.substring(9);
        let amount = parseFloat(data.balance) - parseFloat(beforeData.balance);
        amount = -1 * amount;
        if (user === "BABRA") {
            return admin.firestore().collection('profit')
                .add({
                    docId: 'WITHDRAWN_'+new Date().toDateString()+'_'+user,
                    profit: 0,
                    split: {
                        BABRA: amount,
                        JEFF: 0,
                        VICTOR: 0,
                        remain: 0
                    },
                    submittedOn: admin.firestore.FieldValue.serverTimestamp()
                })
        } else if (user === "JEFF") {
            return admin.firestore().collection('profit')
                .add({
                    docId: 'WITHDRAWN_'+new Date().toDateString()+'_'+user,
                    profit: 0,
                    split: {
                        BABRA: 0,
                        JEFF: amount,
                        VICTOR: 0,
                        remain: 0
                    },
                    submittedOn: admin.firestore.FieldValue.serverTimestamp()
                })
        } else if (user === "VICTOR") {
            return admin.firestore().collection('profit')
                .add({
                    docId: 'WITHDRAWN_'+new Date().toDateString()+'_'+user,
                    profit: 0,
                    split: {
                        BABRA: 0,
                        JEFF: 0,
                        VICTOR: amount,
                        remain: 0
                    },
                    submittedOn: admin.firestore.FieldValue.serverTimestamp()
                })
        }
        return 0;
    }))

exports.reconcileUpload = functions.firestore
    .document('pending_upload/{pendId}')
    .onUpdate((change, context) => {
        const data = change.after.data();
        const url = data.url;
        const id = context.params.pendId;
        const values = data.values;
        const imageId = 'dead_sick/'+data.file_name.substring(5);

        if (data.values.section === "Dead") {
            if (data.values.place === "Cage") {
                admin.firestore().doc('chicken_details/current').update({
                    total: admin.firestore.FieldValue.increment(-1 * parseInt(data.values.chickenNo)),
                    cage: admin.firestore.FieldValue.increment(-1 * parseInt(data.values.chickenNo))
                });
            } else if (data.values.place === "House") {
                admin.firestore().doc('chicken_details/current').update({
                    total: admin.firestore.FieldValue.increment(-1 * parseInt(data.values.chickenNo)),
                    house: admin.firestore.FieldValue.increment(-1 * parseInt(data.values.chickenNo))
                });
            }
        }

        return admin.firestore().collection('dead_sick').add({
            ...values,
            url,
            imageId,
            submittedOn: admin.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            admin.firestore().doc(`pending_upload/${id}`)
                .delete();
        });
    });

exports.salesStats = functions.firestore.document('sales/{saleId}')
    .onCreate((snapshot, context) => {
        const data = snapshot.data();
        const total = parseInt(data.trayNo) * parseFloat(data.trayPrice);
        return admin.firestore().doc('stats/data_sales')
            .get().then((doc) => {
                const prevAmount = doc.data().totalAmountEarned;
                doc.ref.update({
                    totalSales: admin.firestore.FieldValue.increment(parseInt(data.trayNo)),
                    totalAmountEarned: admin.firestore.FieldValue.increment(total),
                    prevAmount,
                    submittedOn: admin.firestore.FieldValue.serverTimestamp()
                })
            });
    });

exports.buysStats = functions.firestore.document('purchases/{buyId}')
    .onCreate((snapshot, context) => {
        const data = snapshot.data();
        const total = parseInt(data.objectNo) * parseFloat(data.objectPrice);
        return admin.firestore().doc('stats/data_buys')
            .get().then((doc) => {
                const prevAmount = doc.data().totalAmountSpent;
                doc.ref.update({
                    totalPurchase: admin.firestore.FieldValue.increment(parseInt(data.objectNo)),
                    totalAmountSpent: admin.firestore.FieldValue.increment(total),
                    prevAmount,
                    submittedOn: admin.firestore.FieldValue.serverTimestamp()
                });
            });
    });

exports.safeBlock = functions.runWith(runtimeOpt).firestore.document('blockchain/{blockId}')
    .onWrite(((change, context) => {
        const data = change.before.exists ? change.before.data() : null;
        const newData = change.after.exists ? change.after.data() : null;
        const timeout = 60 * 1000;

        setTimeout(() => {
            if (data === null && newData) {
                //if doc is created confirm that cloud function created it
                admin.firestore().doc('pending_transactions/cleared').get()
                    .then((doc) => {
                        if (doc.exists) {
                            const pendData = doc.data();
                            const david = {
                                publicKey: new Uint8Array ([
                                    26,
                                    115,
                                    198,
                                    234,
                                    228,
                                    153,
                                    102,
                                    241,
                                    221,
                                    143,
                                    36,
                                    114,
                                    233,
                                    165,
                                    221,
                                    138,
                                    157,
                                    203,
                                    60,
                                    254,
                                    227,
                                    215,
                                    147,
                                    75,
                                    205,
                                    197,
                                    239,
                                    158,
                                    181,
                                    5,
                                    20,
                                    74 ])
                            };
                            const viktoria = {
                                secretKey: new Uint8Array ([
                                    67,
                                    8,
                                    242,
                                    213,
                                    16,
                                    14,
                                    221,
                                    181,
                                    189,
                                    97,
                                    68,
                                    98,
                                    171,
                                    132,
                                    33,
                                    101,
                                    227,
                                    49,
                                    38,
                                    122,
                                    175,
                                    94,
                                    102,
                                    87,
                                    59,
                                    80,
                                    122,
                                    86,
                                    134,
                                    74,
                                    242,
                                    49 ])
                            };

                            function viktoriaDecrypting(message){
                                if (!message) {
                                    return 0;
                                }
                                const cipher = new Uint8Array(message.cipher_text.split`,`.map(x=>+x));
                                const OTP = new Uint8Array(message.one_time_code.split`,`.map(x=>+x));
                                if (cipher.length === 1 || OTP.length === 1) {
                                    return 0;
                                }
                                //Get the decoded message
                                let decoded_message = nacl.box
                                    .open(cipher, OTP,
                                        david.publicKey, viktoria.secretKey);

                                if (decoded_message === null) return 0;

                                //Get the human readable message
                                //return the plaintext
                                return nacl.util.encodeUTF8(decoded_message);
                            }
                            const hash = viktoriaDecrypting(pendData.message);
                            if (SHA512("isDoneFam").toString() !== hash) {
                                admin.firestore().doc(`blockchain/${context.params.blockId}`).get()
                                    .then((docx) => {
                                        admin.firestore().doc('temp/temp').get()
                                            .then((doc) => {
                                                return doc.ref.set({
                                                    on: admin.firestore.FieldValue.serverTimestamp(),
                                                    count: 1
                                                });
                                            }).then(() => {
                                            docx.ref.delete().then(() => {  return console.log('ACCESS_DENIED'); });
                                        })
                                    });
                            } else {
                                doc.ref.update({
                                    message: {
                                        cipher_text: "",
                                        one_time_code: ""
                                    },
                                }).then(() => { return console.log("cleared doc updated!")});
                            }
                        }
                    })
            }
            else {
                admin.firestore().doc('temp/temp').get()
                    .then((doc) => {
                        const data = doc.data();
                        if (parseInt(data.count) !== 0) {
                            //doc was updated
                            return doc.ref.set({
                                on: admin.firestore.FieldValue.serverTimestamp(),
                                count: 0
                            });
                        } else {
                            return admin.firestore().doc('temp/temp').set({
                                on: admin.firestore.FieldValue.serverTimestamp(),
                                count: admin.firestore.FieldValue.increment(1)
                            }).then(() => { return change.after.ref.set(change.before.data()); });
                        }
                    })
            }
        }, timeout);
        return 0;
    }));

exports.clearPending = functions.firestore.document('pending_transactions/cleared').onUpdate(
    ((change, context) => {

        return admin.firestore().collection('pending_transactions')
            .orderBy('submittedOn', 'desc').get()
            .then((snapshot) => {
                return snapshot.docs.forEach((doc) => {
                    const data = doc.data();
                    if (data.values.category === "sales") {
                        return saleInput(data.values);
                    } else if (data.values.category === "buys") {
                        return buyInput(data.values);
                    } else if (data.values.category === "borrow") {
                        borrowInput(data.values);
                        const sender = data.values.borrower.toLowerCase().charAt(0)
                            .toUpperCase().concat(data.values.borrower.toLowerCase().slice(1));

                        let details = {
                            title: `${sender} borrowed some money`,
                            body: `You were assigned by ${sender} to pay Ksh.${numeral(parseInt(data.values.amount)).format("0,0")}`,
                            name: data.values.get_from
                        }
                        return makeANotificationToOneUser(details);
                    } else if (data.values.category === "send") {
                        const sender = data.values.name.toLowerCase().charAt(0)
                            .toUpperCase().concat(data.values.name.toLowerCase().slice(1));
                        let details = {
                            title: `${sender} sent you Money!`,
                            body: `You Have Received Ksh.${numeral(parseInt(data.values.amount)).format("0,0")} from ${sender}`,
                            name: data.values.receiver
                        }
                        return makeANotificationToOneUser(details);
                    }
                });
            }).then(() => {
                return admin.firestore().collection('pending_transactions')
                    .orderBy('submittedOn', 'desc').get()
                    .then(async (snapshot) => {
                        if (snapshot.size === 0) {
                            return console.log("Complete");
                        }
                        const batch = admin.firestore().batch();
                        snapshot.docs.forEach((doc) => {
                            batch.delete(doc.ref);
                        });
                        await batch.commit();
                        return console.log("Complete deleted");
                    });
            });
    }));

exports.deadSick = functions.firestore.document('dead_sick/{deadsickId}').onCreate(
    ((snap, context) => {
        const ds = snap.data();
        const name = ds.submittedBy || '';
        const section = ds.section || '';
        const image = ds.photoURL || null;
        const num = parseInt(ds.chickenNo);
        const docRef = `dead_sick/${context.params.deadsickId}`;
        let notification;
        let details;

        if (section === "Dead") {
            if (num === 1) {
                notification = {
                    content: '1 Chicken Died',
                    extraContent: `${name.charAt(0)+name.slice(1).toLowerCase()} submitted dead chicken data`,
                    identifier: 'dead',
                    user: `${name}`,
                    time: admin.firestore.FieldValue.serverTimestamp(),
                    docRef
                }
                details = {
                    title: `A chicken died`,
                    body: `Click to find out more!`,
                    admin: true,
                    image
                };
            } else {
                notification = {
                    content: 'Some Chickens Died',
                    extraContent: `${name.charAt(0)+name.slice(1).toLowerCase()} submitted dead chicken data`,
                    identifier: 'dead',
                    user: `${name}`,
                    time: admin.firestore.FieldValue.serverTimestamp(),
                    docRef
                }
                details = {
                    title: `Some chickens died`,
                    body: `Click to find out more!`,
                    admin: true,
                    image
                };
            }
        } else if (section === "Sick") {
            if (num === 1) {
                notification = {
                    content: '1 Chicken is sick',
                    extraContent: `${name.charAt(0)+name.slice(1).toLowerCase()} submitted sick chicken data`,
                    identifier: 'sick',
                    user: `${name}`,
                    time: admin.firestore.FieldValue.serverTimestamp(),
                    docRef
                }
                details = {
                    title: `A chicken is sick!`,
                    body: `Click to find out more!`,
                    admin: true,
                    image
                }
            } else {
                notification = {
                    content: 'Some Chickens are sick',
                    extraContent: `${name.charAt(0)+name.slice(1).toLowerCase()} submitted sick chicken data`,
                    identifier: 'sick',
                    user: `${name}`,
                    time: admin.firestore.FieldValue.serverTimestamp(),
                    docRef
                }
                details = {
                    title: `Some chickens are sick!`,
                    body: `Click to find out more!`,
                    admin: true,
                    image
            };
            }
        }
        createNotification(notification);

        return makeANotification(details);
    }));

exports.buysMade = functions.firestore.document('purchases/{buyId}')
    .onWrite((change, context) => {
        const beforeData = change.before.exists ? change.before.data() : false;
        const afterData = change.after.exists ? change.after.data() : false;
        //if create
        if (afterData && !beforeData) {
            if (afterData.replaced) {
                if (afterData.replaced === true) {
                    console.log("JUST A REPLACEMENT DOC!", context.params.buyId);
                    return 0;
                }
            }
            const buy = afterData;
            const firstName = buy.submittedBy.toLowerCase().charAt(0)
                .toUpperCase().concat(buy.submittedBy.toLowerCase().slice(1));
            const feeds = buy.section === "Feeds" ? " Bags of Feeds" : ""
            const item = buy.itemName || buy.section;
            const docRef = `purchases/${context.params.buyId}`;
            const loss = parseInt(buy.objectNo) * parseFloat(buy.objectPrice);

            const lastSunday = buy.date.toDate();
            lastSunday.setDate(lastSunday.getDate() - lastSunday.getDay());
            console.log("LAST SUNDAY:", lastSunday.toDateString());
            admin.firestore().collection('profit')
                .where('docId', '==', lastSunday.toDateString())
                .get().then((query) => {
                if (query.size > 1 || query.size === 0) {
                    errorMessage("BIG QUERY RETURNED: "+query.size, buy.submittedBy);
                }
                query.forEach((doc_) => {
                    const profitDocRef = admin.firestore().doc(`profit/${doc_.id}`);
                    admin.firestore().runTransaction((transaction) => {
                        return transaction.get(profitDocRef).then((_profitDoc) => {
                            let split = 0.05 * (parseFloat(_profitDoc.data().profit) - loss);
                            let remain = 0.85 * (parseFloat(_profitDoc.data().profit) - loss);
                            transaction.update(profitDocRef, {
                                profit: admin.firestore.FieldValue.increment(loss * -1),
                                split: {
                                    BABRA: split,
                                    JEFF: split,
                                    VICTOR: split,
                                    remain
                                },
                                submittedOn: admin.firestore.FieldValue.serverTimestamp()
                            });
                        })
                    });
                })
            });

            const notification = {
                content: 'Purchase was made',
                extraContent: `${buy.submittedBy.charAt(0)+buy.submittedBy.slice(1).toLowerCase()} bought ${buy.objectNo} ${buy.objectNo === 1 ? 'object' : 'objects'}, category ${buy.section}`,
                identifier: 'buy',
                user: `${buy.submittedBy}`,
                time: admin.firestore.FieldValue.serverTimestamp(),
                docRef
            }
            createNotification(notification);

            const details = {
                title: `Purchase made by ${firstName}`,
                body: `${firstName} bought ${buy.objectNo}${feeds}: ${item}!`,
                admin: false
            };

            return makeANotification(details);
        } else if (!afterData && beforeData) {
            if (beforeData.replaced) {
                if (beforeData.replaced === true) {
                    console.log("JUST A REPLACEMENT DOC!", context.params.buyId);
                    return 0;
                }
            }
            //doc deleted
            const buy = beforeData;
            const loss = parseInt(buy.objectNo) * parseFloat(buy.objectPrice);

            const lastSunday = buy.date.toDate();
            lastSunday.setDate(lastSunday.getDate() - lastSunday.getDay());
            console.log("LAST SUNDAY:", lastSunday.toDateString());
            return admin.firestore().collection('profit')
                .where('docId', '==', lastSunday.toDateString())
                .get().then((query) => {
                if (query.size > 1 || query.size === 0) {
                    errorMessage("BIG QUERY RETURNED: "+query.size, buy.submittedBy);
                }
                query.forEach((doc_) => {
                    const profitDocRef = admin.firestore().doc(`profit/${doc_.id}`);
                    admin.firestore().runTransaction((transaction) => {
                        return transaction.get(profitDocRef).then((_profitDoc) => {
                            let split = 0.05 * (parseFloat(doc_.data().profit) + loss);
                            let remain = 0.85 * (parseFloat(doc_.data().profit) + loss);
                            transaction.update(profitDocRef, {
                                profit: admin.firestore.FieldValue.increment(loss),
                                split: {
                                    BABRA: split,
                                    JEFF: split,
                                    VICTOR: split,
                                    remain
                                },
                                submittedOn: admin.firestore.FieldValue.serverTimestamp()
                            });
                        })
                    });
                })
            });
        }
    });

exports.updateTrays = functions.firestore.document('trays/current_trays')
    .onUpdate(((change, context) => {
        const data = change.after.data();
        const beforeData = change.before.exists ? change.before.data() : null;
        const list = data.linkedList;
        let allEggs = 0;
        if (beforeData.linkedList === data.linkedList) return 0;
        let totalEntries = 0;
        let oldestKey = Infinity;
        for (const [key, value] of Object.entries(list)) {
            totalEntries++;
            if (parseInt(key) < oldestKey) oldestKey = key;
            const collected = value.split(',');
            const trayEggs = parseInt(collected[0]) * 30;
            const total = trayEggs + parseInt(collected[1]);
            allEggs += total;
        }
        if (totalEntries > 100) {
            if (list[oldestKey.toString()] === '0,0') {
                delete list[oldestKey.toString()];
                return admin.firestore().doc('trays/current_trays').update({
                    linkedList: list,
                    submittedOn: admin.firestore.FieldValue.serverTimestamp()
                });
            }
        }
        const trays = allEggs / 30;
        let ans = parseInt(trays).toString().concat(',', (allEggs % 30).toString());
        if (ans === data.current) return 0;
        return admin.firestore().doc('trays/current_trays').update({
            current: ans,
            submittedOn: admin.firestore.FieldValue.serverTimestamp()
        });
    }));

exports.prevBalance = functions.firestore.document('current/{curId}')
    .onUpdate((change =>  {
        const beforeData = change.before.exists ? change.before.data() : false;
        const afterData = change.after.exists ? change.after.data() : false;
        if (change.after.id === 'PREV') return 0;
        const changed = beforeData && afterData && (parseFloat(afterData.balance) - parseFloat(beforeData.balance));
        if (Math.abs(changed) > 0) {
            return admin.firestore().doc('current/PREV')
                .update({
                    [change.after.id]: beforeData.balance,
                    submittedOn: admin.firestore.FieldValue.serverTimestamp()
                });
        }
        return 0;
    }))

exports.availWithdraw = functions.firestore.document('profit/{profitId}')
    .onWrite(((change, context) => {
        const beforeData = change.before.exists ? change.before.data() : false;
        const afterData = change.after.exists ? change.after.data() : false;
        const writtenTo = context.params.profitId;

        //can never be deleted
        if (!afterData) {
            console.error("PROFIT DOC DELETED");
            throw new Error("PROFIT DOC DELETED!");
        }

        if (writtenTo === "available") {
            return 0;
        }

        let BABRA = parseFloat(beforeData.split.BABRA) || 0;
        BABRA = parseFloat(afterData.split.BABRA) - BABRA;

        let VICTOR = parseFloat(beforeData.split.VICTOR) || 0;
        VICTOR = parseFloat(afterData.split.VICTOR) - VICTOR;

        let JEFF = parseFloat(beforeData.split.JEFF) || 0;
        JEFF = parseFloat(afterData.split.JEFF) - JEFF;

        let remain = parseFloat(beforeData.split.remain) || 0;
        remain = parseFloat(afterData.split.remain) - remain;

        let totalLeaving = JEFF + VICTOR + BABRA;
        const availDocRef = admin.firestore().doc('profit/available');
        return admin.firestore().runTransaction((transaction) => {
            return transaction.get(availDocRef).then((_availDoc) => {
                const data__ = _availDoc.data();
                transaction.update(availDocRef, {
                    submittedOn: admin.firestore.FieldValue.serverTimestamp(),
                    date: admin.firestore.FieldValue.serverTimestamp(),
                    VICTOR: admin.firestore.FieldValue.increment(VICTOR),
                    prevVICTOR: data__.VICTOR,
                    prevJEFF: data__.JEFF,
                    prevBABRA: data__.BABRA,
                    JEFF: admin.firestore.FieldValue.increment(JEFF),
                    BABRA: admin.firestore.FieldValue.increment(BABRA),
                    remain: admin.firestore.FieldValue.increment(remain),
                    totalLeaving: admin.firestore.FieldValue.increment(totalLeaving)
                })
            })
        });
    }));

exports.salesMade = functions.firestore.document('sales/{saleId}')
    .onWrite((change, context) => {
        const afterData = change.after.exists ? change.after.data() : false;
        const beforeData = change.before.exists ? change.before.data() : false;
        //if create
        if (afterData && !beforeData) {
            if (afterData.replaced) {
                if (afterData.replaced === true) {
                    console.log("JUST A REPLACEMENT DOC!", context.params.saleId);
                    return 0;
                }
            }
            const sale = afterData;
            const profit = parseFloat(parseInt(sale.trayNo) * parseFloat(sale.trayPrice));
            const firstName =  sale.submittedBy.toLowerCase().charAt(0)
                .toUpperCase().concat(sale.submittedBy.toLowerCase().slice(1));
            const docRef = `sales/${context.params.saleId}`;
            const lastSunday = sale.date.toDate();
            lastSunday.setDate(lastSunday.getDate() - lastSunday.getDay());
            console.log("LAST SUNDAY:", lastSunday.toDateString());
            admin.firestore().collection('profit')
                .where('docId', '==', lastSunday.toDateString())
                .get().then((query) => {
                query.forEach((doc_) => {
                    const profitDocRef = admin.firestore().doc(`profit/${doc_.id}`);
                    return admin.firestore().runTransaction((transaction) => {
                        return transaction.get(profitDocRef).then((_profitDoc) => {
                            const split = 0.05 * (parseFloat(_profitDoc.data().profit) + profit);
                            const remain = 0.85 * (parseFloat(_profitDoc.data().profit) + profit);
                            transaction.update(profitDocRef, {
                                profit: admin.firestore.FieldValue.increment(profit),
                                split: {
                                    BABRA: split,
                                    JEFF: split,
                                    VICTOR: split,
                                    remain
                                },
                                submittedOn: admin.firestore.FieldValue.serverTimestamp()
                            })
                        })
                    });
                })
            });
            function saleWord(num) {
                return num === 1 ? 'tray' : 'trays';
            }

            let details;
            const notification = {
                content: 'A sale was made',
                extraContent: `${sale.submittedBy.charAt(0)+sale.submittedBy.slice(1).toLowerCase()} sold ${sale.trayNo} ${saleWord(sale.trayNo)} to ${sale.buyerName}`,
                identifier: 'sell',
                big: parseInt(sale.trayNo) > 4,
                user: `${sale.submittedBy}`,
                time: admin.firestore.FieldValue.serverTimestamp(),
                docRef
            }
            createNotification(notification);

            if (parseInt(sale.trayNo) === 1) {
                details = {
                    title: `${firstName} sold ${sale.trayNo} tray!`,
                    body: `Click to find out more!`,
                    admin: false
                }
            } else {
                details = {
                    title: `${firstName} sold ${sale.trayNo} trays!`,
                    body: `Click to find out more!`,
                    admin: false
                }
            }
            return makeANotification(details);
        } else if (beforeData && !afterData) {
            if (beforeData.replaced) {
                if (beforeData.replaced === true) {
                    console.log("JUST A REPLACEMENT DOC!", context.params.saleId);
                    return 0;
                }
            }
            //doc deleted
            const sale = beforeData;
            const profit = parseFloat(parseInt(sale.trayNo) * parseFloat(sale.trayPrice));
            const lastSunday = sale.date.toDate();
            lastSunday.setDate(lastSunday.getDate() - lastSunday.getDay());
            console.log("LAST SUNDAY:", lastSunday.toDateString());
            return admin.firestore().collection('profit')
                .where('docId', '==', lastSunday.toDateString())
                .get().then((query) => {
                    if (query.size > 1 || query.size === 0) {
                        errorMessage("QUERIED ZERO OR MORE DOCS: "+query.size,
                            sale.submittedBy)
                    }
                query.forEach((doc_) => {
                    const profitDocRef = admin.firestore().doc(`profit/${doc_.id}`);
                    return admin.firestore().runTransaction((transaction) => {
                        return transaction.get(profitDocRef).then((_profitDoc) => {
                            let split = 0.05 * (parseFloat(_profitDoc.data().profit) - profit);
                            let remain = 0.85 * (parseFloat(_profitDoc.data().profit) - profit);
                            transaction.update(profitDocRef, {
                                profit: admin.firestore.FieldValue.increment(profit * -1),
                                split: {
                                    BABRA: split,
                                    JEFF: split,
                                    VICTOR: split,
                                    remain
                                },
                                submittedOn: admin.firestore.FieldValue.serverTimestamp()
                            })
                        })
                    });
                })
            });
        }
    });

exports.toChangeTrays = functions.firestore.document('to_rewind/{rewId}')
    .onWrite(((change, context) => {
        const data = change.after.data();
        if (!data.approved) return 0;

        return admin.firestore().doc('trays/current_trays')
            .get().then((doc) => {
                const trayDoc = doc.data();
                const list = trayDoc.linkedList;
                let dummyList = list;
                for (const [key, value] of Object.entries(list)) {
                    if (key === data.date) {
                        dummyList[key] = data.values;
                    }
                }
                doc.ref.update({
                    linkedList: dummyList,
                    traysUpdate: admin.firestore.FieldValue.serverTimestamp()
                })
            });
    }))
