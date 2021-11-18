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
    errorMessage, safeTrayEggConvert
} = require('./helper');
const numeral = require('numeral');
const {estimatedTrays} = require("./utils");

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
        if (amount >= 0) throw new Error("Expected negative value got positive: "+amount);
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
    .onCreate((snapshot) => {
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
    .onCreate((snapshot) => {
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

        return admin.firestore().doc('me/me').get().then((doc) => {
            if (doc.exists) {
                const isReady = doc.data().isReady;
                if (isReady) return 0;
            }
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
        });
    }));

exports.clearPending = functions.firestore.document('pending_transactions/cleared')
    .onUpdate(
    (() => {

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
            console.log("LAST SUNDAY:", lastSunday.toLocaleDateString());
            admin.firestore().collection('profit')
                .where('docId', '==', lastSunday.toLocaleDateString())
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

function get_bags_data(bagsDoc) {
    const bags_doc_data = bagsDoc.data();
    const str = bags_doc_data.trend;
    let p = str.split(';');
    let dates = p[0];
    let bags_data = p[1];
    dates = dates.split(',');
    bags_data = bags_data.split(',');
    return { dates, bags_data }
}
function get_tray_data(trayDoc) {
    const data__ = trayDoc.data();
    return { linkedList: data__.linkedList, prev: data__.current };
}
function get_chicken_data(chickenDoc) {
    const chickData = chickenDoc.data();
    return parseInt(chickData.total);
}
function clean_date(date) {
    let copyDate = date.split('/');
    return copyDate[1]+'/'+copyDate[0]+'/'+copyDate[2];
}
function get_laying_percent(trays_store, all) {
    const totalEggs = safeTrayEggConvert(trays_store, true);
    return (totalEggs / all) * 100.0;
}
function get_prev_next_sun(timestamp) {
    const prev = new Date(timestamp);
    prev.setDate(prev.getDate() - 1);
    prev.setHours(0, 0, 0, 0);
    const lastSunday = prev;
    lastSunday.setDate(lastSunday.getDate() - lastSunday.getDay());
    const nextSunday = new Date(timestamp);
    nextSunday.setHours(0, 0, 0, 0);
    nextSunday.setDate(nextSunday.getDate() + ((7 - nextSunday.getDay())) % 7);
    return {lastSunday, nextSunday}
}
function getDateString(myDate) {
    return ('0' + myDate.getDate()).slice(-2) + '/'
        + ('0' + (myDate.getMonth()+1)).slice(-2) + '/'
        + myDate.getFullYear();
}

async function eggsChange() {
    // get chicken details doc, trays doc and bags doc
    //get all values needed to work with
    const bagsDoc = await admin.firestore().doc('bags/predicted_bags').get();
    const trayDoc = await admin.firestore().doc('trays/current_trays').get();
    const chickenDoc = await admin.firestore().doc('chicken_details/current').get();
    const assertPresent = bagsDoc.exists && trayDoc.exists && chickenDoc.exists;
    if (!assertPresent) throw new Error("Some docs not present");
    const bagsData = get_bags_data(bagsDoc);
    const trayData = get_tray_data(trayDoc);
    const chickenData = get_chicken_data(chickenDoc);
    const notUpdatedQuery = await admin.firestore().collection('eggs_collected')
        .orderBy('notUpdated', 'asc').get();

    if (notUpdatedQuery.size === 0) return 0;
    let prevLayingPercent = [];
    let submittedBy = [];
    for (let i = 0; i < notUpdatedQuery.size; i++) {
        const notUpdatedDoc = notUpdatedQuery.docs[i];
        const notUpdatedData = notUpdatedQuery.docs[i].data();
        submittedBy.push(notUpdatedData.submittedBy);
        const prevDate = new Date(parseInt(notUpdatedData.date_));
        console.log("NOT UPDATED:", parseInt(notUpdatedData.date_))
        //get previous date used. make sure it exists first
        prevDate.setDate(prevDate.getDate() - 1);
        const querySnapshot = await admin.firestore().collection('eggs_collected')
            .where('date_', '==', prevDate.getTime())
            .get();
        const found = querySnapshot.size === 1;
        if (!found) throw new Error("Date missing for "+prevDate.toDateString());
        const lastEnteredBag = bagsData.dates[bagsData.dates.length - 1];
        const lastEnteredTime = new Date(clean_date(lastEnteredBag));
        const lastEnteredTimeStamp = lastEnteredTime.getTime()+86400000;
        console.log("FOUND:", lastEnteredTimeStamp , "NEEDED:", prevDate.getTime())
        if (Math.abs(lastEnteredTimeStamp - prevDate.getTime()) > 86400000) throw new Error("Wrong bags date");
        bagsData.bags_data.push(notUpdatedData.bags_store.toString());
        bagsData.dates.push(getDateString(new Date(parseInt(notUpdatedData.date_))));
        const layingPercent = get_laying_percent(notUpdatedData.trays_store, chickenData);
        const isEndWeek = new Date(parseInt(notUpdatedData.date_)).getDay() === 0;
        if (isEndWeek) {
            const sundays = get_prev_next_sun(parseInt(notUpdatedData.date_));
            let queryWeek = await admin.firestore().collection('eggs_collected')
                .where('date_', '>=', sundays.lastSunday.getTime())
                .orderBy('date_', 'asc')
                .get();
            if (queryWeek.size < 7) throw new Error("less dates used, found "+queryWeek.size);
            let total = 0;
            let used = 0;
            let count = 0;
            queryWeek.forEach((weekDoc) => {
                count++;
                const weekData = weekDoc.data();
                const isTooNew = parseInt(weekData.date_)
                    >= sundays.nextSunday.getTime();
                const onlyUse = !isTooNew && !Number.isNaN(parseFloat(weekData.layingPercent));
                if (onlyUse) {
                    console.log("PERCENT USED:", weekData.layingPercent);
                    console.log(weekDoc.id, new Date(weekData.date_).toDateString())
                    total += parseFloat(weekData.layingPercent);
                    used++;
                } else if (!isTooNew && Number.isNaN(parseFloat(weekData.layingPercent))) {
                    console.log("FOR NAN:", prevLayingPercent);
                    const percent = parseFloat(prevLayingPercent
                        .filter(x => !Number
                            .isNaN(parseFloat(x[weekData.date_
                                .toString()])))[0][weekData.date_.toString()]);
                    console.log(prevLayingPercent.filter(x => !Number.isNaN(
                        parseFloat(x[weekData.date_.toString()]))))
                    console.log(weekDoc.id, new Date(weekData.date_).toDateString(), percent);
                    total += percent;
                    used++;
                }
                if (queryWeek.size === count) {
                    if (used !== 7) throw  new Error("Wrong used expected 7 but got "+used);
                    total = total / used;
                    console.log("TOTAL:", total, "count", count, "used", used);
                    const prevWeekPercent = parseFloat(chickenDoc.data().weekPercent);
                    notUpdatedDoc.ref.set({
                        notUpdated: admin.firestore.FieldValue.delete(),
                        bags_store: admin.firestore.FieldValue.delete(),
                        layingPercent,
                        weeklyAllPercent: total
                    }, {merge: true});
                    chickenDoc.ref.update({
                        weekPercent: total,
                        prevWeekPercent,
                        submittedBy: notUpdatedData.submittedBy,
                        submittedOn: admin.firestore.FieldValue.serverTimestamp()
                    });
                }
            });

        } else {
            prevLayingPercent.push({[notUpdatedData.date_]: layingPercent });
            await notUpdatedDoc.ref.set({
                notUpdated: admin.firestore.FieldValue.delete(),
                bags_store: admin.firestore.FieldValue.delete(),
                layingPercent
            }, {merge: true});
        }
        trayData.linkedList[notUpdatedData.date_.toString()] = notUpdatedData.trays_store.toString();
    }
    const prev = trayData.prev;
    const trend = bagsData.dates.toString() + ';' + bagsData.bags_data.toString();
    const linkedList = trayData.linkedList;
    console.log("AFTER:", linkedList);
    console.log(trend);
    await trayDoc.ref.update({
        prev,
        linkedList,
        submittedBy,
        submittedOn: admin.firestore.FieldValue.serverTimestamp()
    });
    await bagsDoc.ref.update({trend});
}

exports.onCollect = functions.firestore.document('eggs_collected/{eggId}')
    .onCreate((() => {
        return eggsChange();
    }));

exports.updateTrays = functions.firestore.document('trays/current_trays')
    .onUpdate(((change) => {
        const data = change.after.data();
        const list = data.linkedList;
        let allEggs = 0;
        let totalEntries = 0;
        let oldestKey = Infinity;
        for (const [key, value] of Object.entries(list)) {
            totalEntries++;
            if (parseInt(key) < oldestKey) oldestKey = key;
            const total = safeTrayEggConvert(value, true);
            allEggs += total;
        }
        if (totalEntries > 100) {
            if (list[oldestKey.toString()] === '0,0') {
                delete list[oldestKey.toString()];
                console.log("OLDEST KEY DELETED: ", oldestKey);
                return admin.firestore().doc('trays/current_trays').update({
                    linkedList: list,
                    submittedOn: admin.firestore.FieldValue.serverTimestamp()
                });
            }
        }
        return admin.firestore().collection('late_payment')
            .orderBy('submittedOn', 'desc').get()
            .then((query) => {
                let totalTrays = 0;
                query.forEach((doc) => {
                    const data__ = doc.data().values;
                    const trayNo = parseInt(data__.trayNo);
                    totalTrays += trayNo;
                });
                console.log("Late Trays:", totalTrays);
                let ans = safeTrayEggConvert(allEggs, false, true, totalTrays);
                if (ans === data.current) return 0;
                return estimatedTrays(true).then((estimate) => {
                    return admin.firestore().doc('trays/current_trays').update({
                        current: ans,
                        estimate,
                        submittedOn: admin.firestore.FieldValue.serverTimestamp()
                    });
                });
            })
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

        if (writtenTo === "available") return 0;

        let BABRA = beforeData ? parseFloat(beforeData.split.BABRA) : 0;
        BABRA = parseFloat(afterData.split.BABRA) - BABRA;
        if (afterData.docId.startsWith('WITHDRAWN_') && BABRA > 0) throw new Error("Impossible value found: "+BABRA);

        let VICTOR = beforeData ? parseFloat(beforeData.split.VICTOR) : 0;
        VICTOR = parseFloat(afterData.split.VICTOR) - VICTOR;
        if (afterData.docId.startsWith('WITHDRAWN_') && VICTOR > 0) throw new Error("Impossible value found: "+VICTOR);

        let JEFF = beforeData ? parseFloat(beforeData.split.JEFF) : 0;
        JEFF = parseFloat(afterData.split.JEFF) - JEFF;
        if (afterData.docId.startsWith('WITHDRAWN_') && JEFF > 0) throw new Error("Impossible value found: "+JEFF);

        let remain = beforeData ? parseFloat(beforeData.split.remain) : 0;
        remain = parseFloat(afterData.split.remain) - remain;

        let totalLeaving = JEFF + VICTOR + BABRA;
        const incrementZero = JEFF - VICTOR - BABRA;
        if (incrementZero === 0) return 0;
        const availDocRef = admin.firestore().doc('profit/available');
        if (JEFF && VICTOR === 0) {
            return admin.firestore().runTransaction((transaction) => {
                return transaction.get(availDocRef).then((_availDoc) => {
                    const data__ = _availDoc.data();
                    transaction.update(availDocRef, {
                        submittedOn: admin.firestore.FieldValue.serverTimestamp(),
                        date: admin.firestore.FieldValue.serverTimestamp(),
                        prevBABRA: data__.BABRA,
                        BABRA: admin.firestore.FieldValue.increment(BABRA),
                        remain: admin.firestore.FieldValue.increment(remain),
                        totalLeaving: admin.firestore.FieldValue.increment(totalLeaving)
                    })
                })
            });
        } else if (JEFF && BABRA === 0) {
            return admin.firestore().runTransaction((transaction) => {
                return transaction.get(availDocRef).then((_availDoc) => {
                    const data__ = _availDoc.data();
                    transaction.update(availDocRef, {
                        submittedOn: admin.firestore.FieldValue.serverTimestamp(),
                        date: admin.firestore.FieldValue.serverTimestamp(),
                        VICTOR: admin.firestore.FieldValue.increment(VICTOR),
                        prevVICTOR: data__.VICTOR,
                        remain: admin.firestore.FieldValue.increment(remain),
                        totalLeaving: admin.firestore.FieldValue.increment(totalLeaving)
                    })
                })
            });
        } else if (VICTOR && BABRA === 0) {
            return admin.firestore().runTransaction((transaction) => {
                return transaction.get(availDocRef).then((_availDoc) => {
                    const data__ = _availDoc.data();
                    transaction.update(availDocRef, {
                        submittedOn: admin.firestore.FieldValue.serverTimestamp(),
                        date: admin.firestore.FieldValue.serverTimestamp(),
                        prevJEFF: data__.JEFF,
                        JEFF: admin.firestore.FieldValue.increment(JEFF),
                        remain: admin.firestore.FieldValue.increment(remain),
                        totalLeaving: admin.firestore.FieldValue.increment(totalLeaving)
                    })
                })
            });
        } else {
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
        }
    }));

exports.debtSmear = functions.firestore.document('sales/{saleId}')
    .onCreate(((snapshot, context) => {
        const data = snapshot.data();
        const section = data.section;
        const id = context.params.saleId;
        if (section === "CAKES") {
            return admin.firestore().collection('sales')
                .orderBy('date', 'desc').get()
                .then((query) => {
                    let price = 0;
                    let usedId = '';
                    let done = false;
                    query.forEach((doc) => {
                        if(done) return 0;
                        const isTF = doc.data().section === "THIKA_FARMERS";
                        if (isTF) {
                            price = parseFloat(doc.data().trayPrice);
                            usedId = doc.id;
                            done = true;
                        }
                    });
                    const total = parseFloat(data.trayPrice) * parseInt(data.trayNo);
                    const expected = price * parseInt(data.trayNo);
                    const finalMap = {
                        priceUsed: price,
                        difference: total - expected,
                        usedId,
                        cakeId: id
                    };
                    return admin.firestore().doc('temp/debt_smear')
                        .update({
                            [id+";!!;"+usedId]: finalMap,
                            gross: admin.firestore.FieldValue.increment(finalMap.difference),
                            submittedOn: admin.firestore.FieldValue.serverTimestamp()
                        });
                });
        }
        return 0;
    }))

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
            console.log("LAST SUNDAY:", lastSunday.toLocaleDateString());
            admin.firestore().collection('profit')
                .where('docId', '==', lastSunday.toLocaleDateString())
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
            console.log("LAST SUNDAY:", lastSunday.toLocaleDateString());
            return admin.firestore().collection('profit')
                .where('docId', '==', lastSunday.toLocaleDateString())
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
