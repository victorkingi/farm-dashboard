const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

const admin = require('firebase-admin');
const functions = require('firebase-functions');
const firestore = require('@google-cloud/firestore');
const client = new firestore.v1.FirestoreAdminClient();

const bucket = 'gs://poultry101-6b1ed-firestore-backup';
const numeral = require('numeral');
const {makeANotificationToOneUser,
    makeANotification, createNotification
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
    "MINER", "VICTOR","JEFF","ANNE","THIKA_FARMERS","BABRA","PURITY","BANK",
    "FEEDS","DRUGS","OTHER_SALE","OTHER_BUY","DUKA","CAKES","OTHER_PURITY"
];
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
    const bagRef = admin.firestore().collection("bags").doc("current_bags");
    return admin.firestore().runTransaction((transaction => {
        return transaction.get(bagRef).then((bagDoc) => {
            if (bagDoc.exists) {
                let bagNum = parseFloat(bagDoc.data().number);
                if (bagNum === 0) {
                    const details = {
                        title: `No feeds in store!`,
                        body: `Click to find out more`,
                        admin: false
                    }
                    return makeANotification(details);
                } else {
                    function countDays() {
                        const day = 24 * 60 * 60 * 1000;
                        const errorMargin = 2 * 60 * 60 * 1000;
                        let date_start = bagDoc.data().submittedOn.toDate();
                        let date_end = new Date();

                        let diff = date_end.getTime() - date_start.getTime();
                        diff = Math.floor(diff / day);
                        if (diff === 0) {
                            diff = (date_end.getTime() + errorMargin) - date_start.getTime();
                            diff = Math.floor(diff / day);
                        }
                        return diff;
                    }
                    const diff = countDays();
                    bagNum -= diff;

                    if (bagNum < 0) {
                        bagNum = 0;
                    }

                    transaction.update(bagRef, {
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
            }
            return 0;
        })
    })).catch((err) => {
        return console.error("Error at bags, ", err);
    });
}
async function dailyCurrentTraysCheck() {
    const trayRef = admin.firestore().collection("trays").doc("current_trays");

    return trayRef.get().then((doc) => {
        if (doc.exists) {
            const data = doc.data();
            const num = parseFloat(data.number);

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
    //TODO Calculate balance before mining and use the array of values for verification, not the collection
    //TODO If mining fails, Update Dashboard, mining failed: error message
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
                return parseInt(data.difficulty) === 3;
            }

            if (!isChainValid()) {
                const err = new Error("The blockchain is not valid! corrupted!");
                let details = {
                    title: `Blockchain is invalid!`,
                    body: `${err.message}: ${err.stack}`,
                    name: 'VICTOR'
                }
                makeANotificationToOneUser(details);
                throw err;
            }

            for (let i = 0; i < data.chain.length; i++) {
                for (let p = 0; p <
                data.chain[i].transactions.length; p++) {
                    if (data.chain[i].transactions[p]
                        .fromAddress === users.get(arr[k])) {
                        balance -= parseFloat(data.chain[i].transactions[p].amount);

                    } else if (data.chain[i].transactions[p]
                        .toAddress === users.get(arr[k])) {
                        balance += parseFloat(data.chain[i].transactions[p].amount);
                    }
                }
            }
            const lessBalance = verifyBalance(data);
            balance -= lessBalance;
        });

        if (parseFloat(balance) < 0) {
            const err = new Error(`The blockchain is not valid! Balance of ${arr[k]} less than zero!`);
            let details = {
                title: `Blockchain Invalid!`,
                body: `${err.message}: ${err.stack}`,
                name: 'VICTOR'
            }
            await makeANotificationToOneUser(details);
            throw err;
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

function verifyBalance(data) {
    let wrongBalance = 0;
    for (let i = 0; i < data.chain.length; i++) {
        for (let p = 0; p <
        data.chain[i].transactions.length; p++) {
            if (data.chain[i].transactions[p]
                .replaced !== "" && data.chain[i].transactions[p]
                .replaced !== "null") {
                const date = new Date(data.chain[i].transactions[p]
                    .replaced.substring(0, data.chain[i].transactions[p]
                        .replaced.indexOf('_')));

                for (let k = 0; k < data.chain.length; k++) {
                    for (let m = 0; m <
                    data.chain[k].transactions.length; m++) {
                        if (date.getTime() ===
                            new Date(data.chain[k].transactions[p].timestamp).getTime()) {
                            wrongBalance += parseFloat(data.chain[k].transactions[p].amount);
                        }
                    }
                }
            }
        }
    }
    return wrongBalance;
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

//TODO Add cloud function runs every month once, queries to be deleted collection and deletes everything
//TODO If deadsick also deletes image
exports.recalc = functions.runWith(runtimeOptRecalc).pubsub.schedule('every 2 hours')
    .onRun((async (context) => {
        initializeMap();
        await calculateBalance();
    }))

const runtimeOpts = {
    timeoutSeconds: 540,
    memory: '8GB'
}
let totalTrays = 0;

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
        if (type === "pending" && data.values.trayNo) {
            totalTrays += parseInt(data.values.trayNo);
        }
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

function errorMessage(message, name) {
    const err = new Error(message);
    console.error(err.message);
    let details = {
        title: 'Your Input was rejected!',
        body: `${err.message}: ${err.stack}`,
        name
    }
    makeANotificationToOneUser(details);
    if (name !== 'VICTOR') {
        details = {
            title: "Someone's Input was rejected!",
            body: `${err.message}: ${err.stack}`,
            name: 'VICTOR'
        }
        makeANotificationToOneUser(details);
    }
    throw  err;
}

function checkTrays(trayDoc, values) {
    const current = parseInt(trayDoc.number);
    if (current < totalTrays+parseInt(values.trayNo)) {
        errorMessage("Not enough trays in store!");
    }
}

async function verifyEggs(values) {
    const trayNo = parseInt(values.values.trayNo);
    const date = values.values.date;
    const traysDoc = await admin.firestore()
        .collection("trays").doc("current_trays").get();

    const data = traysDoc.data();
    let timeStamp = date.toDate();
    timeStamp.setDate(timeStamp.getDate() - 1);
    const prevDate = timeStamp;
    timeStamp = timeStamp.getTime();
    let list = JSON.parse(data.linkedList);
    if (list[timeStamp]) {
        const collected = list[timeStamp].split(',');
        const trays = collected[0];
        if (trays < trayNo) {
            const err = `Trays in store on date ${prevDate.toDateString()} are ${trays} but required was ${trayNo}`;
            errorMessage(err, values.values.name);
        } else {
            const collected = list[timeStamp].split(',');
            const newTrays = parseInt(collected[0]) - trayNo;
            list[timeStamp] = newTrays.toString().concat(',', collected[1]);
            list  = JSON.stringify(list);
            admin.firestore().collection('trays').doc('current_trays').update({
                prevSubmittedBy: data.submittedBy,
                submittedBy: values.values.name,
                submittedOn: admin.firestore.FieldValue.serverTimestamp(),
                prevSubmittedOn: data.submittedOn.toDate(),
                prev: data.current,
                linkedList: list
            })
        }
    }
}

async function saleParamCheck(values) {
    const pending = await admin.firestore().collection('pending_transactions')
        .orderBy("submittedOn", "desc").get();
    const sales = await admin.firestore().collection('sales')
        .orderBy("submittedOn", "desc").get();
    const late = await admin.firestore().collection('late_payment')
        .orderBy("submittedOn", "desc").get();
    const trays = await admin.firestore().doc('trays/current_trays').get();
    const trayDoc = trays.data();
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
    checkTrays(trayDoc, values);
    await verifyEggs(values);
}
async function buyParamCheck(values, submittedOn) {
    const pending = await admin.firestore().collection('pending_transactions')
        .orderBy("submittedOn", "desc").get();
    const buys = await admin.firestore().collection('purchases')
        .orderBy("submittedOn", "desc").get();
    let found = false;

    if (values.replaced === "true") {
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
            if (toBeReplaced.exists) {
                const docRef = admin.firestore().doc(`purchases/${toClearId}`);

                const res = await docRef.update({replaced: "true"});
                return console.log("SUCCESSFUL UPDATE DOC", res);
            } else {
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
    //TODO Handle all replace wrong entry
    //TODO Mark 1500 and Feeds entry in my balance as wrong entry
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
}

exports.dailyChanges = functions.runWith(runtimeOpts)
    .pubsub.schedule('every 1 hours from 17:00 to 18:00').onRun(async () => {
        const date  = new Date();
        if (date.getDay() === 0) {
            admin.firestore().collection('profit')
                .add({
                    docId: date.toDateString(),
                    profit: 0,
                    split: {
                        BABRA: 0,
                        JEFF: 0,
                        VICTOR: 0
                    },
                    submittedOn: admin.firestore.FieldValue.serverTimestamp()
                });
        }

    await dailyUpdateBags();
    await dailyCurrentTraysCheck();
    //TODO When querying blockchain add function that loads up all replaced != null,
        //TODO stores in array and for all transactions, in blockchain returns where section,
        //TODO category, date e.t.c != stored values
        //TODO Query previous doc get last block hash and miner balance.
        //TODO Initialise blockchain will prev doc block hash, miner balance. When calculating balance
        //TODO do normal upto today then others if new doc, previousBlock.hash is equal to prev doc last block

    return admin.firestore()
        .collection("pending_transactions")
        .orderBy("submittedOn", "asc")
        .get()
        .then(async (query) => {
            await assertInputsAreCorrect(query);
            let counter = 0;
            console.log("Starting miner...");
            initializeMap();
            const viczcoin = new Blockchain(users.get(USERS.MINER), 999999999999999, 'genesis_block');

            query.forEach((doc) => {
                counter += 1;
                const data = doc.data();

                if (data.values.replaced === "true") {
                    // mine but replaced should
                    throw new Error("Not yet implemented!");
                } else {
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

                        const replaced = JSON.parse(data.values.replaced)
                            ? data.values.date.toDate().toDateString().concat("_")
                                .concat(data.values.section).concat("_")
                                .concat("sales", "_",data.values.buyerName) : "null";
                        const tx1 = new Transaction(users.get(USERS.MINER),
                            users.get(data.values.section), total,
                            actions.SELL.concat("_").concat(data.values.section, ", ").concat(data.values.buyerName,
                                ", FROM: ", USERS.MINER, ", TO: ", data.values.section), replaced,
                            data.values.date.toDate().toDateString());
                        tx1.signTransaction(users.get(USERS.MINER.concat("_pr")));
                        viczcoin.addTransaction(tx1);

                        if (data.values.section !== "THIKA_FARMERS") {
                            const tx2 = new Transaction(users.get(USERS.MINER),
                                users.get(data.values.name), total,
                                actions.SELL.concat("_").concat(data.values.section, ", ").concat(data.values.buyerName,
                                    ", FROM: ", USERS.MINER, ", TO: ", data.values.name),
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

                        const replaced = JSON.parse(data.values.replaced) ? data.values.date.toDate().toDateString().concat("_")
                            .concat(data.values.section).concat("_").concat("purchase", "_", data.values.itemName) : "null";

                        if (data.values.section === "OTHER_PURITY") {
                            const tx1 = new Transaction(users.get(data.values.name),
                                users.get(data.values.section), total, actions.BUY.concat("_")
                                    .concat(data.values.section, ", ")
                                    .concat(data.values.itemName,
                                        ", FROM: ", data.values.name, ", TO: ", data.values.section),
                                replaced, data.values.date.toDate().toDateString());
                            tx1.signTransaction(users.get(data.values.name.concat("_pr")));
                            viczcoin.addTransaction(tx1);
                        } else {
                            const tx1 = new Transaction(users.get(USERS.MINER),
                                users.get(data.values.section), total, actions.BUY.concat("_")
                                    .concat(data.values.section, ", ")
                                    .concat(data.values.itemName,
                                        ", FROM: ", USERS.MINER, ", TO: ", data.values.section),
                                replaced, data.values.date.toDate().toDateString());
                            tx1.signTransaction(users.get(USERS.MINER.concat("_pr")));
                            viczcoin.addTransaction(tx1);
                        }

                    }
                    else if (data.values.category === "borrow") {
                        const replaced = JSON.parse(data.values.replaced) ? data.values.date.toDate().toDateString().concat("_")
                            .concat("BORROWED: ", data.values.borrower, ", GET_FROM: ", data.values.get_from).concat("_").concat("borrowed") : "null";

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
                            users.get(data.values.get_from), parseFloat(data.values.amount), actions.TRADE
                                .concat(", FROM: ", data.values.borrower, ", TO: ", data.values.get_from),
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
                                .concat(", FROM: ", data.values.name, ", TO: ", data.values.receiver),
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
                }
            });
            return console.log("mining done!");
    });
});

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

    admin.firestore().collection('profit').where("time", "==", "Weekly")
        .get().then((query) => {
            const dates = [];
            const profits = [];
            for (let i = 0; i < query.size; i++) {
                const doc = query.docs[i];
                const data = doc.data();
                profits.push(parseFloat(data.profit));
                const myDate = data.submittedOn.toDate();
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

exports.weeklyChanges = functions.runWith(runtimeOptWeekly).pubsub.schedule('every sunday 01:00').onRun((async () => {
    await weeklyChickenAgeUpdate();
    await weeklyExportFirestore();
    predictProfit();
    return 0;
}));

exports.monthlyChanges = functions.pubsub.schedule('1 of month 01:00').onRun(( async () => {
    await monthlyJeffDebt();
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

