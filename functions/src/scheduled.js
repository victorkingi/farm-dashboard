const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

const admin = require('firebase-admin');
const functions = require('firebase-functions');
const firestore = require('@google-cloud/firestore');
const client = new firestore.v1.FirestoreAdminClient();

const bucket = 'gs://poultry101-6b1ed-firestore-backup';
const numeral = require('numeral');
const {
    makeANotificationToOneUser,
    makeANotification,
    createNotification,
    errorMessage
} = require("./helper");

const date = new Date();
const chickenDocRef = admin.firestore().collection("chicken_details")
    .doc("current");

//blockchain
const { Blockchain } = require('./blockchain');
const { Transaction } = require('./transaction');
const { SHA512, ec, actions, USERS } = require('./constants');
const nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');
const keys = require('./addresses.json').keys;
const arr = [
    "MINER", "WITHDRAW_VICTOR", "WITHDRAW_JEFF", "WITHDRAW_BABRA", "VICTOR","JEFF","ANNE","THIKA_FARMERS","BABRA","PURITY","BANK",
    "FEEDS","DRUGS","OTHER_SALE","OTHER_BUY","DUKA","CAKES","OTHER_PURITY"];
const users = new Map();

function initializeMap() {
    for (let i = 0; i < arr.length; i++) {
        const myKey = ec.ellipticCurve.keyFromPrivate(keys[i][arr[i]].prKey);
        const myWalletAddress = myKey.getPublic('hex');
        users.set(arr[i], myWalletAddress);
        users.set(arr[i].concat("_pr"), keys[i][arr[i]].prKey);
    }
}

async function dailyUpdateBags() {
    predictBags();
    setTimeout(() => {
        admin.firestore().doc("bags/current_bags")
            .get().then((bagDoc) => {
            admin.firestore().doc('bags/predicted_bags')
                .get().then((predDoc) => {
                    const predData = predDoc.data();
                    const next = parseInt(predData.nextDay);
                if (bagDoc.exists) {
                    let bagNum = next;
                    bagDoc.ref.update({
                        number: bagNum,
                        submittedOn: admin.firestore.FieldValue.serverTimestamp()
                    });

                    if (bagNum === 0) {
                        const details = {
                            title: `No feeds in store!`,
                            body: `Click to find out more`,
                            admin: false
                        }
                        return makeANotification(details);
                    } else if (bagNum <= 3) {
                        const details = {
                            title: `Few feeds in store!`,
                            body: `Bags of feeds in store are ${bagNum}`,
                            admin: false
                        }
                        return makeANotification(details);
                    }
                }
            })
            return 0;
        }).catch((err) => {
            return console.error("Error at bags, ", err);
        });
    }, 13000);
}
async function dailyCurrentTraysCheck() {
    const trayRef = admin.firestore().collection("trays").doc("current_trays");

    return trayRef.get().then((doc) => {
        if (doc.exists) {
            const data = doc.data();
            const coll = data.current.split(',');
            const num = parseInt(coll[0]);

            if (num <= 10) {
                const details = {
                    title: `Few trays in store!`,
                    body: `Trays in store are just ${num}`,
                    admin: false
                };
                return makeANotification(details);
            } else if (num > 100) {
                const details = {
                    title: `Many trays in store!`,
                    body: `Trays in store are ${num}`,
                    admin: false
                };
                return makeANotification(details);
            }
        }
        return 0;
    }).catch((err) => {
        return console.error(err);
    });
}

async function weeklyChickenAgeUpdate() {
    const startDate = new Date(2020, 2, 9, 12, 32, 45, 67);
    const batch = admin.firestore().batch();

    function weeksBetween(d1, d2) {
        return Math.round((d2 - d1) / (7 * 24 * 60 * 60 * 1000));
    }

    const weeks = weeksBetween(startDate, date);
    const months = weeks / 4;

    batch.update(chickenDocRef, {
        monthNo: months,
        weekNo: weeks
    });

    return batch.commit().then(() => {
        return console.log("chicken age updated");

    }).catch((err) => {
        return console.error("chicken age error, ", err);

    });
}

async function monthlyJeffDebt() {
    const jeffDocRef = admin.firestore().collection('current').doc('JEFF');

    return admin.firestore().runTransaction((transaction => {
        return transaction.get(jeffDocRef).then((jeffDoc) => {
            if (jeffDoc.exists) {
                const data = jeffDoc.data();
                const amount = parseFloat(data.balance);
                const details = {
                    title: `Your Monthly Debt Ksh.${numeral(amount).format("0,0")}`,
                    body: `Dear Jeff, your owe the bank Ksh.${numeral(amount).format("0,0")}`,
                    name: 'JEFF'
                }
                return makeANotificationToOneUser(details);

            }
            return 0;
        });

    })).then(() => {
        return console.log("jeff got his monthly debt");
    }).catch((err) => {
        return console.error("Error jeff monthly debt, ", err);
    });
}
async function weeklyExportFirestore() {
    const projectId = process.env.GCP_PROJECT || process.env.GCLOUD_PROJECT;
    const databaseName = client.databasePath(projectId, '(default)');

    return client.exportDocuments({
        name: databaseName,
        outputUriPrefix: bucket,
        // Leave collectionIds empty to export all collections
        // or set to a list of collection IDs to export,
        // collectionIds: ['users', 'posts']
        collectionIds: []

    }).then(responses => {
        const response = responses[0];
        const details = {
            title: `database exported`,
            body: `${response['name']}`,
            name: "VICTOR"
        }
        makeANotificationToOneUser(details)
        return console.log(`Operation Name: ${response['name']}`);

    }).catch(err => {
        console.error(err);
        const details = {
            title: `database export failed`,
            body: `Check console for more details`,
            name: "VICTOR"
        }
        makeANotificationToOneUser(details)
        throw new Error(`Export operation failed: ${err.message}`);
    });
}

async function calculateBalance() {
    const query = await admin.firestore().collection("blockchain")
        .orderBy("minedOn", "asc")
        .get();
    for (let k = 1; k < arr.length; k++) {
        let balance = 0;
        query.forEach((doc) => {
            const data = doc.data();
            const calculateHash = (tx) => {
                return SHA512(tx.fromAddress + tx.toAddress + tx.amount + tx.reason).toString();
            }
            const blockCalculateHash = (block) => {
                const flattenObject = function (ob) {
                    const toReturn = {};

                    for (const i in ob) {
                        if (!ob.hasOwnProperty(i)) continue;

                        if ((typeof ob[i]) == 'object') {
                            const flatObject = flattenObject(ob[i]);
                            for (const x in flatObject) {
                                if (!flatObject.hasOwnProperty(x)) continue;

                                toReturn[i + '.' + x] = flatObject[x];
                            }
                        } else {
                            toReturn[i] = ob[i];
                        }
                    }
                    return toReturn;
                };
                const myFlattenedObj = flattenObject(block.transactions);
                const str = block.previousHash + block.timestamp + JSON.stringify(myFlattenedObj, Object.keys(myFlattenedObj).sort()) + block.nonce;
                return SHA512(str).toString();
            }
            const isValid = (tx) => {
                if (tx.fromAddress === null) return true;

                if (!tx.signature || tx.signature.length === 0) {
                    throw new Error('No signature in this transaction');
                }

                const publicKey = ec.ellipticCurve.keyFromPublic(tx.fromAddress, 'hex');
                return publicKey.verify(calculateHash(tx), tx.signature);
            }
            const hasValidTransactions = (block) => {
                for (const tx of block.transactions) {
                    if (!isValid(tx)) {
                        return false;
                    }
                }
                return true;
            }
            const isChainValid = () => {
                for (let i = 1; i < data.chain.length; i++) {
                    const currentBlock = data.chain[i];
                    const previousBlock = data.chain[i - 1];

                    if (!hasValidTransactions(currentBlock)) {
                        console.log("INVALID TRANS")
                        return false;
                    }
                    if (currentBlock.hash !== blockCalculateHash(currentBlock)) {
                        console.log("INVALID BLOCK HASH ITS", currentBlock.hash)
                        console.log("EXPECTED", blockCalculateHash(currentBlock))
                        return false;
                    }
                    if (currentBlock.previousHash !== previousBlock.hash) {
                        console.log("INVALID PREV BLOCK HASH ITS", currentBlock.previousHash)
                        console.log("EXPECTED", previousBlock.hash)
                        return false;
                    }
                }
                return true;
            }

            if (!isChainValid()) {
                const err = new Error("The blockchain is not valid! corrupted!");
                console.log(err);
                throw err;
            }

            for (let i = 0; i < data.chain.length; i++) {
                for (let p = 0; p <
                data.chain[i].transactions.length; p++) {
                    const timestamp = data.chain[i].transactions[p].timestamp;
                    let lessAmount = 0;
                    if (new Date(timestamp).getTime() > 1625432400000) {
                        const reason = data.chain[i].transactions[p].reason?.split(';');

                        for (let w = 0; w < data.chain.length; w++) {
                            for (let s = 0; s <
                            data.chain[w].transactions.length; s++) {
                                if (data.chain[w].transactions[s].replaced === ''
                                    || data.chain[w].transactions[s].replaced === 'null') continue;
                                const replace = data.chain[w].transactions[s].replaced?.split(';');
                                let purp = reason && reason[0];
                                let section = reason && reason[1];
                                const sameDate = timestamp === replace[0];
                                const sameSection = section === replace[1];
                                console.log("DATECOUNT:", sameDate);
                                console.log(timestamp, replace[0]);
                                console.log("SECTCOUNT:", sameSection);
                                console.log(section, replace[1]);

                                if (purp === "SELL") {
                                    let buyerName = reason && reason[2];
                                    const sameBuyer = buyerName === replace[3];
                                    console.log("BUYERCOUNT:", sameBuyer);
                                    console.log(buyerName, replace[3]);
                                    if (sameDate && sameSection && sameBuyer) {
                                        lessAmount += parseFloat(data.chain[w].transactions[s].amount);
                                    }
                                } else if (purp === "TRADE") {
                                    if (replace[1].startsWith("BORROWED:")) {
                                        if (sameDate) {
                                            lessAmount += parseFloat(data.chain[w].transactions[s].amount);
                                        }
                                    }
                                } else if (purp === "BUY") {
                                    if (sameDate && sameSection) {
                                        lessAmount += parseFloat(data.chain[w].transactions[s].amount);
                                    }
                                }
                            }
                        }
                    }
                    lessAmount = lessAmount * 2;
                    console.log("LESS:", lessAmount);
                    if (data.chain[i].transactions[p]
                        .fromAddress === users.get(arr[k])) {
                        balance -= parseFloat(data.chain[i].transactions[p].amount);
                        balance += lessAmount;

                    } else if (data.chain[i].transactions[p]
                        .toAddress === users.get(arr[k])) {
                        balance += parseFloat(data.chain[i].transactions[p].amount);
                        balance -= lessAmount;
                    }
                }
            }
        });

        if (parseFloat(balance) < 0) {
            const err = new Error(`The blockchain is not valid! Balance of ${arr[k]} less than zero!`);
            let details = {
                title: `Blockchain Invalid!`,
                body: `${err.message}: ${err.stack}`,
                name: 'VICTOR'
            }
            await makeANotificationToOneUser(details);
            console.log(err);
            throw err;
        } else {
            if (arr[k] === "VICTOR" || arr[k] === "DUKA") {
                balance -= 1500;
                await admin.firestore().doc(`current/${arr[k]}`).update({
                    name: arr[k],
                    address: users.get(arr[k]),
                    balance: parseFloat(balance),
                    submittedOn: admin.firestore.FieldValue.serverTimestamp()
                });
                console.log(arr[k], "updated current", balance);
            } else if (arr[k] === "THIKA_FARMERS") {
                balance -= 63870;
                await admin.firestore().doc(`current/${arr[k]}`).update({
                    name: arr[k],
                    address: users.get(arr[k]),
                    balance: parseFloat(balance),
                    submittedOn: admin.firestore.FieldValue.serverTimestamp()
                });
            } else {
                await admin.firestore().doc(`current/${arr[k]}`).update({
                    name: arr[k],
                    address: users.get(arr[k]),
                    balance: parseFloat(balance),
                    submittedOn: admin.firestore.FieldValue.serverTimestamp()
                });
                console.log(arr[k], "updated current", balance);
            }
        }
    }
}

/*exports.fix = functions.firestore.document('me/me')
    .onCreate(((snapshot, context) => {
    console.log("Starting miner...");
    initializeMap();
    const viczcoin = new Blockchain(users.get(USERS.MINER));
    const tx1 = new Transaction(users.get(USERS.MINER),
        users.get('BANK'), 1350, actions.TRADE.concat("_").concat("WANJA_SENT_TO_BANK"),
        "null", new Date().toDateString());
    tx1.signTransaction(users.get(USERS.MINER.concat("_pr")));
    viczcoin.addTransaction(tx1);
    viczcoin.minePendingTransactions();
    console.log("Is blockchain valid: ", viczcoin.isChainValid());
    const converted = JSON.stringify(viczcoin);
    const final = JSON.parse(converted);
    const all = {
        ...final
    }
    admin.firestore().collection("blockchain").add({
        ...all,
        minedOn: admin.firestore.FieldValue.serverTimestamp()
    }).then(() => { return console.log("DONE"); });
})) */

const runtimeOptRecalc = {
    timeoutSeconds: 540,
    memory: '8GB'
}

exports.recalc = functions.runWith(runtimeOptRecalc).pubsub.schedule('every 2 hours')
    .onRun((async () => {
        initializeMap();
        await calculateBalance();
    }))

const runtimeOpts = {
    timeoutSeconds: 540,
    memory: '8GB'
}

function checkPreExistingDataSale(preExist, values, found, type) {
    for (let i = 0; i < preExist.size; i++) {
        const doc = preExist.docs[i];
        const data = doc.data();
        const checkIfErrored = data.submittedOn.toDate().getTime() === values.submittedOn.toDate().getTime();

        if (checkIfErrored && type === "pending") {
            //prevent false positive of doc pointing to itself
            continue;
        }
        const buyerName = data.values.buyerName;
        const category = data.values.category;
        const date = data.values.date ? data.values.date.toDate().getTime() : null;
        const otherDate = values.values.date.toDate().getTime();
        const checkDate = date === otherDate;
        const section = data.values.section;
        const checkCategory = category === values.values.category;
        const checkSection = section === values.values.section;
        const checkBuyerName = buyerName === values.values.buyerName;
        if (checkCategory && checkSection && checkDate && checkBuyerName) {
            console.log(type.toUpperCase(), "DUPLICATE")
            console.log("DATE:", checkDate)
            console.log("SECTION:", checkSection)
            console.log("CATEGORY:", checkCategory)
            console.log("BUYERNAME:", checkBuyerName)
            found = true;
            break;
        }
    }
    return found;
}

async function verifyEggs(values) {
    const trayNo = parseInt(values.values.trayNo);
    const date = values.values.date;
    const traysDoc = await admin.firestore()
        .collection("trays").doc("current_trays").get();

    const data = traysDoc.data();
    let timeStamp = date.toDate();
    timeStamp.setHours(0, 0, 0, 0);
    timeStamp.setDate(timeStamp.getDate() + 1)
    console.log("DATE:", timeStamp.toDateString())
    if (timeStamp.getTime() < 1625691600000) return 0;
    let list = data.linkedList;
    let justAboveItem;
    let complete = false;
    Object.entries(list)
        .sort(
            (a, b) => parseInt(b[0]) - parseInt(a[0]))
        .forEach(item => {
            if (complete) return 0;
            if (parseInt(item[0]) <= timeStamp.getTime()) {
                justAboveItem = parseInt(item[0]);
                complete = true;
            }
        });
    let toSellEggs = trayNo * 30;
    let lessThanValues = Object.entries(list)
        .filter(x => parseInt(x[0]) <= justAboveItem);

    let remainder;
    let done = false;
    let cleanExit;
    lessThanValues = lessThanValues
        .sort((a, b) => parseInt(b[0]) - parseInt(a[0]));
    console.log("LESS THAN VALUES----------------------------------------------")
    console.log(lessThanValues)
    lessThanValues.forEach(item => {
        if (done) return 0;
        console.log("AT:", new Date(parseInt(item[0])).toDateString(), item[1]);
        const eggStr = item[1].split(',');
        let trays = parseInt(eggStr[0]);
        let eggs = parseInt(eggStr[1]);
        const totalEggs = (trays * 30) + eggs;
        if (toSellEggs - totalEggs < 0) {
            const temp = totalEggs - toSellEggs;
            toSellEggs = 0;
            remainder = {
                date: parseInt(item[0]),
                eggs: temp
            }
            console.log("less than zero");
            done = true;
        } else if (toSellEggs - totalEggs === 0) {
            toSellEggs -= totalEggs;
            console.log("clean");
            cleanExit = parseInt(item[0]);
            done = true;
        } else {
            toSellEggs -= totalEggs;
            console.log("clean");
        }
    });
    if (toSellEggs !== 0) {
        errorMessage("Not enough trays to sell!",
            values.values.name);
    }
}

async function updateEggs(values) {
    const trayNo = parseInt(values.values.trayNo);
    const date = values.values.date;
    const traysDoc = await admin.firestore()
        .collection("trays").doc("current_trays").get();

    const data = traysDoc.data();
    let timeStamp = date.toDate();
    timeStamp.setHours(0, 0, 0, 0);
    timeStamp.setDate(timeStamp.getDate() + 1)
    console.log("DATE:", timeStamp.toDateString())
    if (timeStamp.getTime() < 1625691600000) return 0;
    let list = data.linkedList;
    let justAboveItem;
    let complete = false;
    Object.entries(list)
        .sort(
            (a, b) => parseInt(b[0]) - parseInt(a[0]))
        .forEach(item => {
            if (complete) return 0;
            if (parseInt(item[0]) <= timeStamp.getTime()) {
                justAboveItem = parseInt(item[0]);
                complete = true;
            }
        });
    let toSellEggs = trayNo * 30;
    let lessThanValues = Object.entries(list)
        .filter(x => parseInt(x[0]) <= justAboveItem);

    let remainder;
    let done = false;
    let cleanExit;
    lessThanValues = lessThanValues
        .sort((a, b) => parseInt(b[0]) - parseInt(a[0]));
    console.log("LESS THAN VALUES----------------------------------------------")
    console.log(lessThanValues)
    lessThanValues.forEach(item => {
        if (done) return 0;
        console.log("AT:", new Date(parseInt(item[0])).toDateString(), item[1]);
        const eggStr = item[1].split(',');
        let trays = parseInt(eggStr[0]);
        let eggs = parseInt(eggStr[1]);
        const totalEggs = (trays * 30) + eggs;
        if (toSellEggs - totalEggs < 0) {
            const temp = totalEggs - toSellEggs;
            toSellEggs = 0;
            remainder = {
                date: parseInt(item[0]),
                eggs: temp
            }
            console.log("less than zero");
            done = true;
        } else if (toSellEggs - totalEggs === 0) {
            toSellEggs -= totalEggs;
            console.log("clean");
            cleanExit = parseInt(item[0]);
            done = true;
        } else {
            toSellEggs -= totalEggs;
            console.log("clean");
        }
    });

    if (toSellEggs !== 0) {
        errorMessage("Previous check got passed, not enough trays!",
            values.values.name);
    }

    if (remainder) {
        let eggStr = `${parseInt(remainder.eggs / 30)},${remainder.eggs % 30}`;
        console.log(eggStr, new Date(remainder.date).toDateString());
        //get all items between justabove and remainder date replace with 0,0
        //if val === remainder date then replace with num
        //else replace with 0
        lessThanValues
            .filter(x => parseInt(x[0]) >= remainder.date).forEach((item => {
            if (parseInt(item[0]) === remainder.date) {
                list[item[0]] = eggStr;
            } else {
                list[item[0]] = '0,0';
            }
        }))

    } else if (cleanExit) {
        //get all entries between justaboveitem and clean exit
        lessThanValues
            .filter(x => parseInt(x[0]) >= cleanExit).forEach((item => {
            list[item[0]] = '0,0';
        }))
    }
    return admin.firestore().doc('trays/current_trays')
        .update({
            submittedOn: admin.firestore.FieldValue.serverTimestamp(),
            linkedList: list,
            prevSubmittedOn: data.submittedOn,
            prevSubmittedBy: data.submittedBy,
            prev: data.current
        });
}

async function saleParamCheck(values) {
    const pending = await admin.firestore().collection('pending_transactions')
        .orderBy("submittedOn", "desc").get();
    const sales = await admin.firestore().collection('sales')
        .orderBy("submittedOn", "desc").get();
    const late = await admin.firestore().collection('late_payment')
        .orderBy("submittedOn", "desc").get();
    let found = false;
    found = checkPreExistingDataSale(late, values, found, "late");
    found = checkPreExistingDataSale(pending, values, found, "pending");

    for (let i = 0; i < sales.size; i++) {
        const doc = sales.docs[i];
        const data = doc.data();
        const buyerName = data.buyerName;
        const category = data.category;
        const date = data.date.toDate().getTime();
        const section = data.section;

        const checkDate = date === values.values.date.toDate().getTime();
        const checkCategory = category === values.values.category;
        const checkSection = section === values.values.section;
        const checkBuyerName = buyerName === values.values.buyerName;
        if (checkCategory && checkSection && checkDate && checkBuyerName) {
            console.log("SALES", "DUPLICATE")
            console.log("DATE:", checkDate)
            console.log("SECTION:", checkSection)
            console.log("CATEGORY:", checkCategory)
            console.log("BUYERNAME:", checkBuyerName)
            found = true;
            break;
        }
    }

    if (found) {
        errorMessage("Duplicate data!", values.values.name);
    }
    //checks if some sales will not have enough eggs to burn
    await verifyEggs(values);
}
async function buyParamCheck(values, submittedOn) {
    const pending = await admin.firestore().collection('pending_transactions')
        .orderBy("submittedOn", "desc").get();
    const buys = await admin.firestore().collection('purchases')
        .orderBy("submittedOn", "desc").get();
    let found = false;

    if (values.replaced === true) {
        let toClearId = "";
        for (let i = 0; i < buys.size; i++) {
            const doc = buys.docs[i];
            const data = doc.data();
            const category = data.category;
            const date = data.date.toDate().getTime();
            const section = data.section;

            const checkDate = date === values.date.toDate().getTime();
            const checkCategory = category === values.category;
            const checkSection = section === values.section;
            console.log(date, values.date.toDate().getTime());
            console.log("DATE:", checkDate);
            console.log(category, values.category);
            console.log("CAT:", checkCategory);
            console.log(section, values.section);
            console.log("SECTION:", checkSection);
            if (checkCategory && checkSection && checkDate) {
                found = true;
                toClearId = doc.id;
                break;
            }
        }

        if (!found) {
            return errorMessage("ENTRY TO REPLACE NOT FOUND!", values.name);
        } else {
            const toBeReplaced = await admin.firestore().doc(`purchases/${toClearId}`).get();
            if (!toBeReplaced.exists) {
                return errorMessage("DOC TO BE REPLACED NOT FOUND!".concat("id is:", toClearId), values.name);
            }
        }
    } else {
        for (let i = 0; i < pending.size; i++) {
            const doc = pending.docs[i];
            const data = doc.data();
            const checkIfErrored = data.submittedOn.toDate().getTime() === submittedOn.toDate().getTime();

            if (checkIfErrored) {
                //prevent false positive of doc pointing to itself
                continue;
            }

            const category = data.values.category;
            const date = data.values.date ? data.values.date.toDate().getTime() : null;
            const section = data.values.section;

            const checkDate = date === values.date.toDate().getTime();
            const checkCategory = category === values.category;
            const checkSection = section === values.section;
            if (checkCategory && checkSection && checkDate) {
                found = true;
                break;
            }
        }
        for (let i = 0; i < buys.size; i++) {
            const doc = buys.docs[i];
            const data = doc.data();
            const category = data.category;
            const date = data.date.toDate().getTime();
            const section = data.section;

            const checkDate = date === values.date.toDate().getTime();
            const checkCategory = category === values.category;
            const checkSection = section === values.section;
            if (checkCategory && checkSection && checkDate) {
                found = true;
                break;
            }
        }
        if (found) {
            return errorMessage("Duplicate data!", values.name);
        }
    }
}
async function borrowParamCheck(values, submittedOn) {
    const pending = await admin.firestore().collection('pending_transactions')
        .orderBy("submittedOn", "desc").get();
    const current = await admin.firestore().collection('current')
        .doc(values.borrower).get();
    const balance = parseFloat(current.data().balance);
    let found = false;

    if (balance < parseFloat(values.amount)) {
        errorMessage("Insufficient Funds!");
    }

    for (let i = 0; i < pending.size; i++) {
        const doc = pending.docs[i];
        const data = doc.data();
        const checkIfErrored = data.submittedOn.toDate().getTime() === submittedOn.toDate().getTime();

        if (checkIfErrored) {
            //prevent false positive of doc pointing to itself
            continue;
        }

        const borrower = data.values.borrower;
        const date = data.values.date ? data.values.date.toDate().getTime() : null;
        const get_from = data.values.get_from;

        const checkDate = date === values.date.toDate().getTime();
        const checkBorrower = borrower === values.borrower;
        const checkGetFrom = get_from === values.get_from;
        if (checkGetFrom && checkBorrower && checkDate) {
            found = true;
            break;
        }
    }
    if (found) {
        errorMessage("Duplicate data!", values.name);
    }
}
async function sendParamCheck(values, submittedOn) {
    const pending = await admin.firestore().collection('pending_transactions')
        .orderBy("submittedOn", "desc").get();
    const current = await admin.firestore().collection('current')
        .doc(values.name).get();
    const balance = parseFloat(current.data().balance);

    let totalSending = 0;
    for (let i = 0; i < pending.size; i++) {
        const doc = pending.docs[i];
        const data = doc.data();
        const checkIfErrored = data.submittedOn.toDate().getTime() === submittedOn.toDate().getTime();

        if (checkIfErrored) {
            //prevent false positive of doc pointing to itself
            continue;
        }

        const initiator = data.values.name;
        const category = data.values.category;
        const section = data.values.section;

        const checkInitiator = initiator === values.name;
        const checkCategory = category === "send";
        if (checkInitiator && checkCategory) {
            //add to total
            totalSending += parseFloat(data.values.amount);
        }
        if (data.values.receiver === values.name) {
            totalSending -= parseFloat(data.values.amount);
        }
        if (checkInitiator && category === "sales" && section !== "THIKA_FARMERS") {
            totalSending -= parseInt(data.values.trayNo) * parseFloat(data.values.trayPrice);
        }
    }

    totalSending += parseFloat(values.amount);

    if (balance < totalSending) {
        errorMessage("Insufficient Funds!", values.initiator);
    }
}

async function assertInputsAreCorrect(query) {
    for (let i = 0; i < query.size; i++) {
        const doc = query.docs[i];
        const data = doc.data();
        if (data.values.category === "sales") {
            await saleParamCheck(data);
        }
        else if (data.values.category === "buys") {
            await buyParamCheck(data.values, data.submittedOn);
        }
        else if (data.values.category === "borrow") {
            await borrowParamCheck(data.values, data.submittedOn);
        }
        else if (data.values.category === "send") {
            await sendParamCheck(data.values, data.submittedOn);
        }
    }
    for (let i = 0; i < query.size; i++) {
        const doc = query.docs[i];
        const data = doc.data();
        if (data.values.category === "sales") {
            //burns eggs
            await updateEggs(data);
        }
    }
}

function getDateString(myDate) {
    return ('0' + myDate.getDate()).slice(-2) + '/'
        + ('0' + (myDate.getMonth()+1)).slice(-2) + '/'
        + myDate.getFullYear();
}
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
    const collected = trays_store.split(',');
    const trayEggs = parseInt(collected[0]) * 30;
    const totalEggs = trayEggs + parseInt(collected[1]);
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
        lastEnteredTime.setHours(0, 0, 0, 0);
        const lastEnteredTimeStamp = lastEnteredTime.getTime();
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
    await bagsDoc.ref.update({trend})
}

exports.eggsChange = functions.region('europe-west2').pubsub
    .schedule('every 1 hours from 02:00 to 03:00')
    .timeZone('Africa/Nairobi').onRun(() => {
    return eggsChange();
})

const cleanString = (str) => {
    let str_1 = str.toUpperCase().charAt(0).concat(str.toLowerCase().slice(1));
    str_1 = str_1.includes('_') ? str_1.replace('_', ' ') : str_1;
    let str_2 = str_1.includes(' ') ? str_1.substring(str_1.lastIndexOf(' ')+1) : null;
    str_2 = str_2 !== null ? str_2.toUpperCase().charAt(0).concat(str_2.toLowerCase().slice(1)) : null;
    if (str_2 !== null) {
        str_1 = str_1.substring(0, str_1.lastIndexOf(" ")).concat(" ").concat(str_2);
    }
    return str_1
}
function getRanColor() {
    const randomColor = Math.floor(Math.random()*16777215).toString(16);
    return "#"+randomColor;
}
async function updateTxList() {
    const blockAll = await admin.firestore().collection("blockchain")
        .orderBy("minedOn", "desc")
        .get();
    const block = blockAll.docs;
    const labels = [];
    let data = [];
    let sent;
    let time = [];
    let all = [];
    const accepted = ["PURITY", "JEFF", "VICTOR", "BABRA", "ANNE"];
    for (let i = 0; i < blockAll.size; i++) {
        const data = block[i].data();
        for (let p = 0; p < data.chain.length; p++) {
            for (let k = 0; k < data.chain[p].transactions.length; k++) {
                const reason = data.chain[p].transactions[k].reason || '';
                const amount = data.chain[p].transactions[k].amount;
                const timeStamp = data.chain[p].transactions[k].timestamp;
                if (reason.substring(0, 5) === 'TRADE' || reason.substring(0, 4) === 'SELL') {
                    let to = reason.split(':');
                    to = to[to.length - 1].substring(1);
                    if (!accepted.includes(to)) continue;
                    to = cleanString(to);
                    all.push({
                        to,
                        amount: parseFloat(amount),
                        timestamp: new Date(timeStamp)
                    });
                }
            }
        }
    }
    all = all.sort((a, b) => { return b.timestamp.getTime() - a.timestamp.getTime()});
    for (let i = 0; i < all.length; i++) {
        labels.push(all[i].to);
        data.push(all[i].amount);
        time.push(all[i].timestamp);
    }
    sent = data;
    let total = data.reduce((a, b) => a + b, 0);
    data = data.map(x => Math.floor((x/total) * 100));
    let color = new Array(data.length).fill('');
    color = color.map(_ => getRanColor());
    let ranKey = 0;
    let key = data.map(x => ranKey++);
    const ans = {
        labels,
        data,
        color,
        total,
        sent,
        time,
        key
    };
    return await admin.firestore().doc('transactions/all_tx')
        .set({
            ...ans,
            submittedOn: admin.firestore.FieldValue.serverTimestamp()
        });
}

exports.updateTx = functions.region('europe-west2').pubsub
    .schedule('every 24 hours')
    .timeZone('Africa/Nairobi').onRun(() => {
        return updateTxList();
    });

/**
 * eggsChange function always has to run earlier than dailyChanges function to prevent
 * situation where trays are sold on the same day they where collected and no
 * trays to burn are available in the linked list to accomodate the transaction.
 */
exports.dailyChanges = functions.runWith(runtimeOpts).region('europe-west2')
    .pubsub.schedule('every 1 hours from 03:00 to 04:00')
    .timeZone('Africa/Nairobi').onRun(async () => {
        await dailyUpdateBags();
        await dailyCurrentTraysCheck();
        return admin.firestore()
            .collection("pending_transactions")
            .orderBy("submittedOn", "asc")
            .get()
            .then(async (query) => {
                await assertInputsAreCorrect(query);
                initializeMap();
                await calculateBalance();
                let counter = 0;
                console.log("Balances correct, Starting miner...");
                let difficulty = await admin.firestore().doc('temp/difficulty').get();
                difficulty = parseInt(difficulty.data().diff);
                const viczcoin = new Blockchain(users.get(USERS.MINER),
                    999999999999999,
                    'genesis_block', difficulty);
                query.forEach((doc) => {
                    counter += 1;
                    const data = doc.data();
                    if (data.values.category === "sales") {
                        const total = parseFloat(data.values.trayNo)
                            * parseFloat(data.values.trayPrice);
                        if (total <= 0) {
                            const err = new Error("Less than zero / zero!");
                            let details = {
                                title: `Less than zero / zero!`,
                                body: `${err.message}: ${err.stack}`,
                                name: 'VICTOR'
                            }
                            makeANotificationToOneUser(details);
                            throw err;
                        }
                        let replaced = 'null';
                        if (data.values.replaced) {
                            replaced = JSON.parse(data.values.replaced)
                                ? data.values.date.toDate().toDateString().concat(";")
                                    .concat(data.values.section).concat(";")
                                    .concat("sales", ";",data.values.buyerName) : "null";
                        }
                        const tx1 = new Transaction(
                            users.get(USERS.MINER),
                            users.get(data.values.section), total,
                            actions.SELL.concat(";", data.values.section, ";",
                                data.values.buyerName, ";FROM:", USERS.MINER, ";TO:",
                                data.values.section), replaced,
                            data.values.date.toDate().toDateString());
                        tx1.signTransaction(users.get(USERS.MINER.concat("_pr")));
                        viczcoin.addTransaction(tx1);
                            if (data.values.section !== "THIKA_FARMERS") {
                                const tx2 = new Transaction(users.get(USERS.MINER),
                                    users.get(data.values.name), total,
                                    actions.SELL.concat(";").concat(data.values.section, ";").concat(data.values.buyerName,
                                        ";FROM:", USERS.MINER, ";TO:", data.values.name),
                                    replaced, data.values.date.toDate().toDateString());
                                tx2.signTransaction(users.get(USERS.MINER.concat("_pr")));
                                viczcoin.addTransaction(tx2);
                            }
                        }
                        else if (data.values.category === "buys") {
                            const total = parseFloat(data.values.objectNo) * parseFloat(data.values.objectPrice);
                            if (total <= 0) {
                                const err = new Error("Less than zero / zero!");
                                let details = {
                                    title: `Less than zero / zero!`,
                                    body: `${err.message}: ${err.stack}`,
                                    name: 'VICTOR'
                                }
                                makeANotificationToOneUser(details);
                                throw err;
                            }
                            let replaced = 'null';
                            if (data.values.replaced) {
                                replaced = JSON.parse(data.values.replaced) ? data.values.date.toDate()
                                    .toDateString().concat(";")
                                    .concat(data.values.section).concat(";").concat("purchase") : "null";
                            }

                            if (data.values.section === "OTHER_PURITY") {
                                const tx1 = new Transaction(users.get(data.values.name),
                                    users.get(data.values.section), total, actions.BUY.concat(";")
                                        .concat(data.values.section, ";")
                                        .concat(data.values.itemName,
                                            ";FROM:", data.values.name, ";TO:", data.values.section),
                                    replaced, data.values.date.toDate().toDateString());
                                tx1.signTransaction(users.get(data.values.name.concat("_pr")));
                                viczcoin.addTransaction(tx1);
                            } else {
                                const tx1 = new Transaction(users.get(USERS.MINER),
                                    users.get(data.values.section), total, actions.BUY.concat(";")
                                        .concat(data.values.section, ";")
                                        .concat(data.values.itemName,
                                            ";FROM:", USERS.MINER, ";TO:", data.values.section),
                                    replaced, data.values.date.toDate().toDateString());
                                tx1.signTransaction(users.get(USERS.MINER.concat("_pr")));
                                viczcoin.addTransaction(tx1);
                            }

                        }
                        else if (data.values.category === "borrow") {
                        let replaced = 'null';
                        if (data.values.replaced) {
                            replaced = JSON.parse(data.values.replaced) ? data.values.date.toDate()
                                .toDateString().concat(";")
                                .concat("BORROWED:", data.values.borrower, ";GET_FROM:",
                                    data.values.get_from).concat(";").concat("borrow") : "null";
                        }

                            if (parseFloat(data.values.amount) <= 0) {
                                const err = new Error("Less than zero / zero!");
                                let details = {
                                    title: `Less than zero / zero!`,
                                    body: `${err.message}: ${err.stack}`,
                                    name: 'VICTOR'
                                }
                                makeANotificationToOneUser(details);
                                throw err;
                            }
                            const tx1 = new Transaction(users.get(data.values.borrower),
                                users.get(data.values.get_from), parseFloat(data.values.amount),
                                actions.TRADE.concat(";FROM:", data.values.borrower, ";TO:",
                                    data.values.get_from),
                                replaced, data.values.date.toDate().toDateString());
                            tx1.signTransaction(users.get(data.values.borrower.concat("_pr")));
                            viczcoin.addTransaction(tx1);
                        }
                        else if (data.values.category === "send") {
                            if (parseFloat(data.values.amount) <= 0) {
                                const err = new Error("Less than zero / zero!");
                                let details = {
                                    title: `Less than zero / zero!`,
                                    body: `${err.message}: ${err.stack}`,
                                    name: 'VICTOR'
                                }
                                makeANotificationToOneUser(details);
                                throw err;
                            }

                            const tx1 = new Transaction(users.get(data.values.name), users.get(data.values.receiver),
                                parseFloat(data.values.amount), actions.TRADE
                                    .concat(";FROM:", data.values.name, ";TO:", data.values.receiver),
                                "null", data.submittedOn.toDate().toDateString());
                            tx1.signTransaction(users.get(data.values.name.concat("_pr")));
                            viczcoin.addTransaction(tx1);
                        }
                        if (counter === query.size) {
                            viczcoin.minePendingTransactions();
                            console.log("Is blockchain valid: ", viczcoin.isChainValid());
                            const hash = viczcoin.getLatestBlock().hash;
                            const converted = JSON.stringify(viczcoin);
                            const final = JSON.parse(converted);
                            const all = {
                                ...final
                            }
                            async function calcAndSend(hash) {
                                const notification = {
                                    content: 'A block was mined',
                                    extraContent: `Hash of ${hash}`,
                                    identifier: 'mine',
                                    user: `MINER`,
                                    time: admin.firestore.FieldValue.serverTimestamp(),
                                }
                                createNotification(notification);
                                function davidEncrypting(){
                                    const david = {
                                        secretKey: new Uint8Array ([
                                            233,
                                            216,
                                            90,
                                            133,
                                            40,
                                            79,
                                            126,
                                            212,
                                            17,
                                            200,
                                            50,
                                            211,
                                            4,
                                            132,
                                            46,
                                            146,
                                            111,
                                            111,
                                            120,
                                            140,
                                            99,
                                            156,
                                            76,
                                            138,
                                            150,
                                            212,
                                            141,
                                            81,
                                            248,
                                            49,
                                            52,
                                            10 ]
                                        )
                                    };
                                    const viktoria = {
                                        publicKey: new Uint8Array ([
                                            220,
                                            42,
                                            120,
                                            140,
                                            198,
                                            11,
                                            136,
                                            251,
                                            140,
                                            222,
                                            150,
                                            95,
                                            111,
                                            110,
                                            42,
                                            88,
                                            173,
                                            59,
                                            131,
                                            233,
                                            101,
                                            85,
                                            187,
                                            100,
                                            157,
                                            101,
                                            89,
                                            25,
                                            201,
                                            227,
                                            174,
                                            40 ])
                                    };
                                    //David computes a one time shared key
                                    const david_shared_key = nacl.box.before(viktoria.publicKey,david.secretKey);

                                    //David also computes a one time code.
                                    const one_time_code = nacl.randomBytes(24);

                                    //Davids message
                                    const plain_text = SHA512("isDoneFam").toString();

                                    //Getting the cipher text
                                    const cipher_text = nacl.box.after(
                                        nacl.util.decodeUTF8(plain_text),
                                        one_time_code,
                                        david_shared_key
                                    );

                                    //message to be transited.
                                    return {cipher_text, one_time_code};
                                }
                                const cipher = davidEncrypting();
                                const cipher_text = String(cipher.cipher_text);
                                const one_time_code = String(cipher.one_time_code);

                                await admin.firestore()
                                    .doc('pending_transactions/cleared').update({
                                        isDone: admin.firestore.FieldValue.serverTimestamp(),
                                        message: {
                                            cipher_text,
                                            one_time_code
                                        }
                                    });
                                return await calculateBalance();
                            }
                            admin.firestore().collection("blockchain").add({
                                ...all,
                                minedOn: admin.firestore.FieldValue.serverTimestamp()
                            }).then(async () => {
                                await calcAndSend(hash);
                            });
                        }
                });
                return console.log("mining done!");
        });
});

function predictBags() {
    const url = "https://europe-west2-poultry101-6b1ed.cloudfunctions.net/predict-bags";

    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            console.log(xhr.status);
            console.log("RESPONSE", xhr.responseText);
            const resJson = JSON.parse(xhr.responseText);
            let date1 = new Date(resJson['0'].ds);
            date1.setHours(0, 0, 0, 0);
            let date2 = new Date(resJson['1'].ds);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            let selected = date1.getTime();
            let i = 0;
            while(selected < today.getTime()) {
                if (resJson[`${i}`]) {
                    selected = new Date(resJson[`${i}`].ds).getTime();
                    i++;
                } else {
                    break;
                }
            }
            const val1 = parseFloat(resJson[`${i}`].yhat);
            date1 = new Date(resJson[`${i}`].ds);
            date2 = date1;
            let val2 = val1;
            if (resJson[`${i+1}`]) {
                val2 = parseFloat(resJson[`${i+1}`].yhat);
                date2 = new Date(resJson[`${i+1}`].ds);
            }
            async function update() {
                const predictDoc1 = admin.firestore().doc('bags/predicted_bags');
                const batch = admin.firestore().batch();
                batch.update(predictDoc1, {
                    nextDay: val1,
                    next2Day: val2,
                    day1Date: date1,
                    day2Date: date2,
                    submittedOn: admin.firestore.FieldValue.serverTimestamp()
                });
                await batch.commit();
            }
            update();
        }};

    admin.firestore().doc('bags/predicted_bags')
        .get().then((doc) => {
        const data = doc.data();
        const toSend = `{"message":"${data.trend}"}`
        console.log("DATA:", toSend);
        xhr.send(toSend);
    });
}

function predictProfit() {
    const url = "https://europe-west2-poultry101-6b1ed.cloudfunctions.net/predict-profit";

    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);

    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            console.log(xhr.status);
            console.log("RESPONSE", xhr.responseText);
            const resJson = JSON.parse(xhr.responseText);
            const date1 = new Date(resJson['0'].ds);
            const date2 = new Date(resJson['1'].ds);
            const profit1 = parseFloat(resJson['0'].yhat);
            const profit2 = parseFloat(resJson['1'].yhat);
            async function update() {
                const predictDoc1 = admin.firestore().doc('predict_week/predict_profit1');
                const predictDoc2 = admin.firestore().doc('predict_week/predict_profit2');
                const batch = admin.firestore().batch();
                batch.update(predictDoc1, {
                    profit: profit1,
                    date: date1,
                    submittedOn: admin.firestore.FieldValue.serverTimestamp()
                });
                batch.update(predictDoc2, {
                    profit: profit2,
                    date: date2,
                    submittedOn: admin.firestore.FieldValue.serverTimestamp()
                });
                await batch.commit();
            }
            update();
        }};

    admin.firestore().collection('profit').orderBy("profit", "asc")
        .get().then((query) => {
            const dates = [];
            const profits = [];
            for (let i = 0; i < query.size; i++) {
                const doc = query.docs[i];
                const data = doc.data();
                profits.push(parseFloat(data.profit));
                const myDate = new Date(data.docId);
                const myDateString = ('0' + myDate.getDate()).slice(-2) + '/'
                    + ('0' + (myDate.getMonth()+1)).slice(-2) + '/'
                    + myDate.getFullYear();
                dates.push(myDateString);
            }
            const data = `{"message":"${dates.toString()};${profits.toString()}"}`
        console.log("DATA:", data);
        xhr.send(data);
    });
}

const runtimeOptWeekly = {
    timeoutSeconds: 540,
}

exports.weeklyChanges = functions.runWith(runtimeOptWeekly)
    .pubsub.schedule('every sunday 01:00').onRun((async () => {
    await weeklyChickenAgeUpdate();
    await weeklyExportFirestore();
    predictProfit();
    const sunday = new Date();
    sunday.setHours(0, 0, 0, 0);
    await admin.firestore().collection('profit')
        .add({
            docId: date.toDateString(),
            date: sunday,
            profit: 0,
            split: {
                BABRA: 0,
                JEFF: 0,
                VICTOR: 0,
                remain: 0
            },
            submittedOn: admin.firestore.FieldValue.serverTimestamp()
        });
    return 0;
}));

async function updateMonthlyRev() {
    const buyGross = await admin.firestore().doc('stats/data_buys')
        .get();
    const saleGross = await admin.firestore().doc('stats/data_sales')
        .get();
    const saleGrossVal = saleGross.data().totalAmountEarned;
    const buyGrossVal = buyGross.data().totalAmountSpent;
    saleGross.ref.set({
        prevMonth: saleGrossVal,
        submittedOn: admin.firestore.FieldValue.serverTimestamp(),
        totalAmountEarned: 0
    }, { merge: true });
    buyGross.ref.set({
        prevMonth: buyGrossVal,
        submittedOn: admin.firestore.FieldValue.serverTimestamp(),
        totalAmountSpent: 0
    }, { merge: true });
    return 0;
}

exports.monthlyChanges = functions.pubsub
    .schedule('1 of month 01:00').onRun(( async () => {
    await monthlyJeffDebt();
    await updateMonthlyRev();
    return 0;
}));

/**
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 * WARNING!!  WARNING!!  WARNING!!  WARNING!!  WARNING!!  WARNING!!  WARNING!!  WARNING!!  WARNING!!  WARNING!!  WARNING
 * **********************************************UPROACHING DANGER ZONE!!***********************************************
 *
 *
 *
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!ONLY EXECUTE ON GENUINE EMERGENCY!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 *
 *
 */

/**
 *
 * const googleapi = require('googleapis');
 const google = googleapi.google;
 const GoogleAuth = require('google-auth-library');
 const billing = google.cloudbilling('v1').projects;
 const PROJECT_ID = process.env.GCLOUD_PROJECT;
 const PROJECT_NAME = `projects/${PROJECT_ID}`;
 *
 * function setCred() {

    const client = new GoogleAuth({
        scopes: [
            'https://www.googleapis.com/auth/cloud-billing',
            'https://www.googleapis.com/auth/cloud-platform',
        ],
    });
    // Set credential globally for all requests
    google.options({
        auth: client,
    });

}

  async function DISABLEBILLING() {
    setCred();
    if (PROJECT_NAME) {
        const billingInfo = await billing.getBillingInfo({name: PROJECT_NAME});
        if (billingInfo.data.billingEnabled) {
            const result = await billing.updateBillingInfo({
                name: PROJECT_NAME,
                requestBody: {billingAccountName: ''}
            });
            console.log("billing disabled successfully");
            console.log(JSON.stringify(result));
        } else {
            console.log("billing already disabled");
        }
    }
}
 **/
