const admin = require('firebase-admin');
const functions = require('firebase-functions');
const { SHA512 } = require('./constants');
const nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');

const {makeANotification, makeANotificationToOneUser, createNotification} = require('./helper');
const numeral = require('numeral');
const {borrowInput} = require("./helper");
const {buyInput} = require("./helper");
const {saleInput} = require("./helper");

const runtimeOpt = {
    timeoutSeconds: 180
}

//TODO Add check if dates on eggs are same
//TODO Add notification for send & borrow

exports.salesStats = functions.firestore.document('sales/{saleId}')
    .onCreate((snapshot, context) => {
        const data = snapshot.data();
        const total = parseInt(data.trayNo) * parseFloat(data.trayPrice);
        return admin.firestore().collection('stats')
            .doc('data_sales').update({
                totalSales: admin.firestore.FieldValue.increment(parseInt(data.trayNo)),
                totalAmountEarned: admin.firestore.FieldValue.increment(total),
                submittedOn: admin.firestore.FieldValue.serverTimestamp()
            })
    });

exports.buysStats = functions.firestore.document('purchases/{buyId}')
    .onCreate((snapshot, context) => {
        const data = snapshot.data();
        const total = parseInt(data.objectNo) * parseFloat(data.objectPrice);
        return admin.firestore().collection('stats')
            .doc('data_buys').update({
                totalPurchase: admin.firestore.FieldValue.increment(parseInt(data.objectNo)),
                totalAmountSpent: admin.firestore.FieldValue.increment(total),
                submittedOn: admin.firestore.FieldValue.serverTimestamp()
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

exports.layingPercentage = functions.firestore.document('chicken_details/current')
    .onWrite(((change) => {
        const prevData = change.before.data();
        const newData = change.after.data();

        if (newData.spam === true) {
            return null;
        }

        const prevCage = parseInt(prevData.weekCagePercent) || 0;
        const prevHouse = parseInt(prevData.weekHousePercent) || 0;
        const newCage = parseInt(newData.weekCagePercent) || 0;
        const newHouse = parseInt(newData.weekHousePercent) || 0;
        let cageDif = newCage - prevCage;
        let houseDif = newHouse - prevHouse;

        if (cageDif < 0) {
            cageDif = cageDif * -1;
            const rounded = Math.round((cageDif + Number.EPSILON) * 100) / 100;
            const details = {
                title: `Laying Percentage decreased!`,
                body: `Cage Laying Percentage decreased by ${rounded}% this week`,
                admin: true
            };
            makeANotification(details);


        } else if (cageDif > 0) {
            const rounded = Math.round((cageDif + Number.EPSILON) * 100) / 100;
            const details = {
                title: `Laying Percentage increased!`,
                body: `Cage Laying Percentage increased by ${rounded}% this week`,
                admin: true
            };
            makeANotification(details);

        }

        if (houseDif < 0) {
            houseDif = houseDif * -1;
            const rounded = Math.round((houseDif + Number.EPSILON) * 100) / 100;
            const details = {
                title: `Laying Percentage decreased!`,
                body: `House Laying Percentage decreased by ${rounded}% this week`,
                admin: true
            };
            makeANotification(details);


        } else if (houseDif > 0) {
            const rounded = Math.round((houseDif + Number.EPSILON) * 100) / 100;
            const details = {
                title: `Laying Percentage increased!`,
                body: `House Laying Percentage increased by ${rounded}% this week`,
                admin: true
            };
           makeANotification(details);

        }

        return null;
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

exports.eggsChange = functions.firestore.document('eggs_collected/{eggId}')
    .onCreate( (snapshot, context) => {
        const data = snapshot.data();
        const currentDate = new Date(parseInt(data.date_));
        console.log("CURRENT:", currentDate.toDateString());
        const prevDate = currentDate;
        prevDate.setDate(currentDate.getDate() - 1);
        console.log("PREV DATE", prevDate.toDateString());
        admin.firestore().collection('eggs_collected').orderBy("date_", "desc")
            .limit(2)
            .get()
            .then((query) => {
                console.log("SIZE: ", query.size);
                let count = 0;
                let found = false;
                query.forEach((doc) => {
                    count++;
                    console.log("QUERIED DOC:", doc.id);
                    console.log("JUST ENTERED", snapshot.id);
                    if (doc.id !== snapshot.id) {
                        const prevData = doc.data();
                        const myDate = new Date(parseInt(prevData.date_));
                        console.log("FOUND:", myDate.toDateString());

                        if (prevDate.getTime() === myDate.getTime()) {
                            found = true;
                        }

                        if (query.size === count && found) {
                        admin.firestore().doc('chicken_details/current').get()
                            .then((doc_) => {
                                const chickData = doc_.data();
                                const all = parseInt(chickData.total);
                                const collected = data.trays_store.split(',');
                                const trayEggs = parseInt(collected[0]) * 30;
                                const totalEggs = trayEggs + parseInt(collected[1]);
                                let layingPercent = (totalEggs / all) * 100.0;
                                const getDay = new Date().getDay();
                                if (getDay === 0) {
                                    const prev = new Date();
                                    prev.setDate(new Date().getDate() - 1);
                                    prev.setHours(0, 0, 0, 0);
                                    const lastSunday = prev;
                                    lastSunday.setDate(lastSunday.getDate() - lastSunday.getDay());
                                    console.log("LAST SUNDAY DATE:", lastSunday.toDateString());
                                    admin.firestore().collection('eggs_collected')
                                        .where('date', '>', lastSunday)
                                        .get().then((query) => {
                                        let count = 0;
                                        let total = 0;
                                        query.forEach((doc__) => {
                                            count++;
                                            const data__ = doc__.data();
                                            total += parseFloat(data__.layingPercent);
                                            if (query.size === count) {
                                                total = total / 7;
                                                snapshot.ref.set({
                                                    weeklyAllPercent: total
                                                });
                                                doc_.ref.update({
                                                    weekPercent: total,
                                                    submittedBy: data.submittedBy,
                                                    submittedOn: admin.firestore.FieldValue.serverTimestamp()
                                                })
                                            }
                                        })
                                    })
                                } else {
                                    snapshot.ref.set({
                                        ...data,
                                        layingPercent
                                    });
                                    admin.firestore().doc('trays/current_trays')
                                        .get().then((doc__) => {
                                            console.log("DOC EXISTS:", doc__.exists);
                                            if (doc__.exists) {
                                                const data__ = doc__.data();
                                                const linkedList = JSON.parse(data__.linkedList);
                                                linkedList[data.date_] = data.trays_store;
                                                const newList = JSON.stringify(linkedList);
                                                let prev = data__.current;
                                                doc__.ref.update({
                                                    prev,
                                                    linkedList: newList,
                                                    submittedBy: data.submittedBy,
                                                    submittedOn: admin.firestore.FieldValue.serverTimestamp()
                                                }).then(() => {
                                                    console.log("LINKED LIST UPDATED");
                                                })
                                            }
                                    })
                                }
                            })
                        return console.log("DONE");

                        } else if (query.size === count && !found) {
                            snapshot.ref.delete().then(() => {
                                const err = new Error("Wrong eggs date submitted");
                                console.log("Expected", prevDate.toDateString());
                                console.log(err.message);
                                let details = {
                                    title: 'Your Input was rejected!',
                                    body: `${err.message}: ${err.stack}`,
                                    name: data.submittedBy
                                }
                                makeANotificationToOneUser(details);
                                details = {
                                    title: `Input was rejected!: ${data.submittedBy}`,
                                    body: `${err.message}: ${err.stack}`,
                                    name: 'VICTOR'
                                }
                                makeANotificationToOneUser(details);
                                throw  err;
                            });
                        }
                    }
                })
            })
    })

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
    })
)

exports.buysMade = functions.firestore.document('purchases/{buyId}')
    .onCreate((snap, context) => {
        const buy = snap.data();
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
            query.forEach((doc_) => {
                let split = 0.05 * (parseFloat(doc_.data().profit) - loss);
                let remain = 0.85 * (parseFloat(doc_.data().profit) - loss);
                if ((parseFloat(doc_.data().profit) - loss) < 0) {
                    split = 0;
                    remain = 0;
                }
                doc_.ref.update({
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
        })

        const notification = {
            content: 'Purchase was made',
            extraContent: `${buy.submittedBy.charAt(0)+buy.submittedBy.slice(1).toLowerCase()} bought ${buy.objectNo} objects, category ${buy.section}`,
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

    });

exports.updateTrays = functions.firestore.document('trays/current_trays')
    .onUpdate(((change, context) => {
        const data = change.after.data();
        const list = JSON.parse(data.linkedList);
        let allEggs = 0;

        for (const [key, value] of Object.entries(list)) {
            const collected = value.split(',');
            const trayEggs = parseInt(collected[0]) * 30;
            const total = trayEggs + parseInt(collected[1]);
            allEggs += total;
        }
        const trays = allEggs / 30;
        let ans = parseInt(trays).toString().concat(',', (allEggs % 30).toString());
        if (ans === data.current) return 0;
        admin.firestore().doc('trays/current_trays').update({
            current: ans,
            submittedOn: admin.firestore.FieldValue.serverTimestamp()
        });
    }));

exports.availWithdraw = functions.firestore.document('profit/{profitId}')
    .onWrite(((change, context) => {
        const beforeData = change.before.exists ? change.before.data() : false;
        const afterData = change.after.exists ? change.after.data() : false;
        const writtenTo = context.params.profitId;
        //TODO Prevent infinite loop
        //can never be deleted
        if (!afterData) {
            console.error("PROFIT DOC DELETED");
            throw new Error("PROFIT DOC DELETED!");
        }

        if (writtenTo === "available") {
            return 0;
        }

        let BABRA = parseFloat(beforeData.split.BABRA);
        BABRA = parseFloat(afterData.split.BABRA) - BABRA;

        let VICTOR = parseFloat(beforeData.split.VICTOR);
        VICTOR = parseFloat(afterData.split.VICTOR) - VICTOR;

        let JEFF = parseFloat(beforeData.split.JEFF);
        JEFF = parseFloat(afterData.split.JEFF) - JEFF;

        let remain = parseFloat(beforeData.split.remain);
        remain = parseFloat(afterData.split.remain) - remain;

        let totalLeaving = JEFF + VICTOR + BABRA;

        return admin.firestore().doc('profit/available')
            .update({
                submittedOn: admin.firestore.FieldValue.serverTimestamp(),
                VICTOR: admin.firestore.FieldValue.increment(VICTOR),
                JEFF: admin.firestore.FieldValue.increment(JEFF),
                BABRA: admin.firestore.FieldValue.increment(BABRA),
                remain: admin.firestore.FieldValue.increment(remain),
                totalLeaving
            });

    }))

exports.salesMade = functions.firestore.document('sales/{saleId}')
    .onCreate((snap, context) => {
        const sale = snap.data();
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
                    const split = 0.05 * (parseFloat(doc_.data().profit) + profit);
                    const remain = 0.85 * (parseFloat(doc_.data().profit) + profit);
                    doc_.ref.update({
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
        })

        let details;
        const notification = {
            content: 'A sale was made',
            extraContent: `${sale.submittedBy.charAt(0)+sale.submittedBy.slice(1).toLowerCase()} sold ${sale.trayNo} trays to ${sale.buyerName}`,
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

    });
