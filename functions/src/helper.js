const admin = require('firebase-admin');

const allTopic = 'ALL_USERS';
const adminTopic = 'ADMIN_USERS';

function makeid(l) {
    let text = "";
    const char_list = '!#$%&()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[]^_abcdefghijklmnopqrstuvwxyz{|}~';
    for (let i = 0; i < l; i++) {
        text += char_list.charAt(Math.floor(Math.random() * char_list.length));
    }
    return text;
}

function sendAMessage(message) {
    admin.messaging().send(message)
        .then((response) => {
            // Response is a message ID string.
            return console.log('Successfully sent message:', response);
        })
        .catch((error) => {
            return console.error('Error sending message:', error);
        });
}

module.exports = {
    saleInput: function saleInput(val) {
        const buyer = val.buyerName ? val.buyerName : val.section;
        const salesDocRef = admin.firestore().collection("sales").doc();
        let total = parseInt(val.trayNo) * parseInt(val.trayPrice);
        const traysDocRef = admin.firestore()
            .collection("trays").doc("current_trays");

        admin.firestore().collection("sales")
            .orderBy("submittedOn", "desc")
            .limit(10).get().then( (snapshot) => {
                let found = false;
            snapshot.docs.forEach((doc) => {
                if (found) {
                    return 0;
                }
                if (JSON.parse(doc.data().replaced) === false) {
                    const prevWeeklyTotal = parseInt(doc.data().weeklyTotal);
                    const prevMonthlyTotal = parseInt(doc.data().monthlyTotal);
                    const weeklyTotal = total + prevWeeklyTotal;
                    const monthlyTotal = total + prevMonthlyTotal;

                    found = true;
                    return admin.firestore()
                        .runTransaction((transaction) => {
                        return transaction.get(salesDocRef).then((_saleDoc) => {
                            return transaction.get(traysDocRef).then((traysDoc) => {
                                function commonTransaction() {
                                    if (traysDoc.exists) {
                                        const trayData = traysDoc.data().number;
                                        const final = parseInt(trayData) - parseInt(val.trayNo);
                                            transaction.update(traysDocRef, {
                                                cloud: false,
                                                number: final,
                                                submittedBy: val.name,
                                                submittedOn: admin.firestore.FieldValue.serverTimestamp()
                                            });
                                    }
                                }

                                commonTransaction();

                                transaction.set(salesDocRef, {
                                    ...val,
                                    buyerName: buyer,
                                    weeklyTotal,
                                    monthlyTotal,
                                    date: val.date,
                                    submittedBy: val.name,
                                    submittedOn: admin.firestore.FieldValue.serverTimestamp()
                                });
                            })
                        })
                    });
                }

            });
        })
            .then(() => { return console.log("SALES_ENTERED") });
    },
    buyInput: function buyInput(buys) {
        const section = buys.section;
        const key = makeid(28);
        const buyDocRef = admin.firestore().collection("purchases").doc();
        const bagsDocRef = admin.firestore().collection("bags")
            .doc("current_bags");
        const total = parseInt(buys.objectNo) * parseInt(buys.objectPrice);

        admin.firestore().collection('purchases')
            .orderBy("submittedOn", "desc")
            .limit(10).get().then((snapshot) => {
                let found = false;

                snapshot.docs.forEach((doc) => {
                    if (found) {
                        return 0;
                    }

                    if (JSON.parse(doc.data().replaced) === false) {
                        found = true;
                        const prevWeeklySpend = parseInt(doc.data().weeklySpend);
                        const prevMonthlySpend = parseInt(doc.data().monthlySpend)
                        const newWeeklySpend = total + prevWeeklySpend;
                        const newMonthlySpend = total + prevMonthlySpend;

                        return admin.firestore().runTransaction((transaction) => {
                            return transaction.get(buyDocRef).then((_buyDoc) => {
                                function commonTransactions() {
                                    if (section === "FEEDS") {
                                        transaction.update(bagsDocRef, {
                                            number: admin.firestore.FieldValue.increment(parseInt(buys.objectNo)),
                                            key,
                                            date: buys.date,
                                            submittedBy: buys.name,
                                            submittedOn: buys.date
                                        });
                                    }
                                    transaction.set(buyDocRef, {
                                        ...buys,
                                        key,
                                        usedWeek: false,
                                        usedMonth: false,
                                        weeklySpend: newWeeklySpend,
                                        monthlySpend: newMonthlySpend,
                                        date: buys.date,
                                        submittedBy: buys.name,
                                        submittedOn: admin.firestore.FieldValue.serverTimestamp()
                                    });
                                }

                                commonTransactions();
                            });
                        }).then(() => {
                            return console.log("BUY_ENTERED");
                        }).catch(err => {
                            const error = err.message || err;
                            return console.error(error);
                        });
                    }
                });
            });
    },
    borrowInput: function borrowInput(val) {
        admin.firestore().collection("borrow").add({
            ...val,
            submittedOn: admin.firestore.FieldValue.serverTimestamp()
        }).then(() => { return console.log("BORROW_ENTERED"); })
    },
    sendAMessage: function sendAMessage(message) {
        admin.messaging().send(message)
            .then((response) => {
                // Response is a message ID string.
                return console.log('Successfully sent message:', response);
            })
            .catch((error) => {
                return console.error('Error sending message:', error);
            });
    },
    makeANotificationToOneUser: function makeANotificationToOneUser(details) {
        return admin.firestore().collection("notify_token").doc(details.name)
            .collection("tokens").orderBy("submittedOn", "desc")
            .get().then((query) => {
                return query.forEach((doc) => {
                    const data = doc.data();
                    const token = data.token || null;

                    if (typeof token === 'string') {
                        const myMessage = {
                            data: {
                                title: details.title,
                                body: details.body,
                                icon: 'https://firebasestorage.googleapis.com/v0/b/poultry101-6b1ed.appspot.com/o/FCMImages%2Fchicken-symbol_318-10389.jpg?alt=media&token=03095d15-af9a-4678-b0c8-9b03d9a1c9cc'
                            },
                            token
                        }
                        return sendAMessage(myMessage);
                    }
                    return null;
                })
            })
    },
    makeANotification: function makeANotification(details) {
        let message;

        if (details) {
            //laying percentage and profit/loss message only admins receive
            if (details.admin === true && details.image) {
                message = {
                    data: {
                        title: details.title,
                        body: details.body,
                        image: details.image,
                        icon: 'https://firebasestorage.googleapis.com/v0/b/poultry101-6b1ed.appspot.com/o/FCMImages%2Fchicken-symbol_318-10389.jpg?alt=media&token=03095d15-af9a-4678-b0c8-9b03d9a1c9cc'
                    },
                    topic: adminTopic
                }
            } else if (details.admin === true) {
                message = {
                    data: {
                        title: details.title,
                        body: details.body,
                        icon: 'https://firebasestorage.googleapis.com/v0/b/poultry101-6b1ed.appspot.com/o/FCMImages%2Fchicken-symbol_318-10389.jpg?alt=media&token=03095d15-af9a-4678-b0c8-9b03d9a1c9cc'
                    },
                    topic: adminTopic
                }
            } else {
                message = {
                    data: {
                        title: details.title,
                        body: details.body,
                        icon: 'https://firebasestorage.googleapis.com/v0/b/poultry101-6b1ed.appspot.com/o/FCMImages%2Fchicken-symbol_318-10389.jpg?alt=media&token=03095d15-af9a-4678-b0c8-9b03d9a1c9cc'
                    },
                    topic: allTopic
                }
            }

            return sendAMessage(message);
        } else {
            return null;
        }
    },
    createNotification: function createNotification(notification) {
        return admin.firestore().collection('notifications')
            .doc().set({
                ...notification,
            })
            .then(doc => console.log('notification added', doc))
            .catch(err => {
                return console.error(`ERROR: ${err}`)
            });
    }
}
