const admin = require('firebase-admin');
const functions = require('firebase-functions');
const firestore = require('@google-cloud/firestore');
const client = new firestore.v1.FirestoreAdminClient();
const bucket = 'gs://poultry101-6b1ed-firestore-backup';

const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const numeral = require('numeral');
const {
    makeANotificationToOneUser,
    makeANotification,
    createNotification,
    errorMessage,
    safeTrayEggConvert
} = require("./helper");
const date = new Date();
const chickenDocRef = admin.firestore().collection("chicken_details")
    .doc("current");

//blockchain
const { Blockchain } = require('./blockchain');
const { Transaction } = require('./transaction');
const { SHA512, ec, actions, USERS } = require('./constants');
const nacl = require('tweetnacl');
const {estimatedTrays} = require("./utils");
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
    // predictBags();
    const today = new Date();
    const bagDoc = await admin.firestore().doc('bags/predicted_bags').get();
    const trend = bagDoc.data().trend.split(';');
    let dates = trend[0].split(',');
    let values = trend[1].split(',');
    if (dates.length !== values.length) throw new Error("Invalid date/val number");
    const latestVal = values[values.length - 1];
    const latestDate = dates[dates.length - 1];
    let cleanedDate = latestDate.split('/');
    cleanedDate = `${cleanedDate[1]}/${cleanedDate[0]}/${cleanedDate[2]}`;
    const lastDate = new Date(cleanedDate);
    lastDate.setDate(lastDate.getDate()+1);
    const diff = today.getTime() - lastDate.getTime();
    const days = Math.floor(diff / 86400000);
    let finalVal = parseInt(latestVal) - days;
    if (finalVal < 0) {
        finalVal = 0;
        await admin.firestore().doc("bags/current_bags").update({
            number: 0,
            submittedOn: admin.firestore.FieldValue.serverTimestamp()
        });
    } else {
        await admin.firestore().doc("bags/current_bags").update({
            number: finalVal,
            submittedOn: admin.firestore.FieldValue.serverTimestamp()
        });
    }
    if (finalVal === 0) {
        const details = {
            title: `No feeds in store!`,
            body: `Click to find out more`,
            admin: false
        }
        return makeANotification(details);
    } else if (finalVal <= 3) {
        const details = {
            title: `Few feeds in store!`,
            body: `Bags of feeds in store are ${finalVal}`,
            admin: false
        }
        return makeANotification(details);
    }
    return 0;
}
async function dailyCurrentTraysCheck() {
    const trayRef = admin.firestore().collection("trays").doc("current_trays");

    return trayRef.get().then((doc) => {
        if (doc.exists) {
            const data = doc.data();
            const coll = data.estimate.split(',');
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

async function calculateBalance() {
    const query = await admin.firestore().collection("blockchain")
        .orderBy("minedOn", "asc")
        .get();
    for (let k = 1; k < arr.length; k++) {
        let balance = 0;
        query.forEach((doc) => {
            const data = doc.data();
            const calculateHash = (tx) => {
                const EPOCH_CHANGE = 1628888400000; // A big change occurred
                // here hence verification will happen differently
                return data.minedOn.toDate().getTime() > EPOCH_CHANGE ? SHA512(tx.fromAddress + tx.toAddress + tx.amount
                    + tx.reason + tx.replaced + tx.timestamp).toString() : SHA512(tx.fromAddress + tx.toAddress + tx.amount
                    + tx.reason).toString();
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
                        console.log(currentBlock);
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
                    if (data.chain[i].transactions[p]
                        .fromAddress === users.get(arr[k])) {
                        balance -= parseFloat(data.chain[i].transactions[p].amount);

                    } else if (data.chain[i].transactions[p]
                        .toAddress === users.get(arr[k])) {
                        balance += parseFloat(data.chain[i].transactions[p].amount);
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
const runtm = {
    timeoutSeconds: 540,
    memory: '4GB'
}

exports.fix = functions.runWith(runtm).firestore.document('me/me')
    .onCreate((() => {
        async function mine() {
            /*console.log("Starting miner...");
            initializeMap();
            let difficulty = await admin.firestore().doc('temp/difficulty').get();
            difficulty = parseInt(difficulty.data().diff);
            const viczcoin = new Blockchain(users.get(USERS.MINER),
                999999,
                'genesis_block', difficulty);
            const tx1 = new Transaction(users.get('FEEDS'),
                users.get(USERS.MINER),48700, actions.TRADE
                    .concat(";FROM:", 'FEEDS', ";TO:", 'MINER'),
                "null", new Date().toDateString());
            tx1.signTransaction(users.get(USERS.FEEDS.concat("_pr")));
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
            }).then(() => { return console.log("DONE"); }); */
        }
        return mine();
}));

const runtimeOptRecalc = {
    timeoutSeconds: 540,
    memory: '8GB'
}

exports.recalc = functions.runWith(runtimeOptRecalc).pubsub.schedule('every 2 hours')
    .onRun((async () => {
        initializeMap();
        await calculateBalance();
    }));

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

async function verifyEggs(values, id) {
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
        const totalEggs = safeTrayEggConvert(item[1], true);
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
        await admin.firestore().doc(`pending_transactions/${id}`).update({
            rejected: true
        });
        errorMessage("Not enough trays to sell!",
            values.values.name);
    }
}

async function updateEggs(values, id) {
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
        const totalEggs = safeTrayEggConvert(item[1], true);
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
        await admin.firestore().doc(`pending_transactions/${id}`).update({
            rejected: true
        });
        errorMessage("Previous check got passed, not enough trays!",
            values.values.name);
        return false;
    }

    if (remainder) {
        let eggStr = safeTrayEggConvert(remainder.eggs, false);
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
    await admin.firestore().doc('trays/current_trays')
        .update({
            submittedOn: admin.firestore.FieldValue.serverTimestamp(),
            linkedList: list,
            prevSubmittedOn: data.submittedOn,
            prevSubmittedBy: data.submittedBy,
            prev: data.current
        });
    return true;
}

async function saleParamCheck(values, id) {
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
        await admin.firestore().doc(`pending_transactions/${id}`).update({
            rejected: true
        });
        errorMessage("Duplicate data!", values.values.name);
    }
    //checks if some sales will not have enough eggs to burn
    await verifyEggs(values, id);
}

async function buyParamCheck(values, submittedOn, id) {
    const pending = await admin.firestore().collection('pending_transactions')
        .orderBy("submittedOn", "desc").get();
    const buys = await admin.firestore().collection('purchases')
        .orderBy("submittedOn", "desc").get();
    let found = false;

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
        await admin.firestore().doc(`pending_transactions/${id}`).update({
            rejected: true
        });
        return errorMessage("Duplicate data!", values.name);
    }
}
async function borrowParamCheck(values, submittedOn, id) {
    const pending = await admin.firestore().collection('pending_transactions')
        .orderBy("submittedOn", "desc").get();
    const current = await admin.firestore().collection('current')
        .doc(values.borrower).get();
    const balance = parseFloat(current.data().balance);
    let found = false;

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
        if (data.values.borrower === values.name && category === "borrow") {
            totalSending += parseFloat(data.values.amount);
        }
        if (data.values.get_from === values.name && category === "borrow") {
            totalSending -= parseFloat(data.values.amount);
        }
    }

    totalSending += parseFloat(values.amount);

    if (balance < totalSending) {
        await admin.firestore().doc(`pending_transactions/${id}`).update({
            rejected: true
        });
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
        await admin.firestore().doc(`pending_transactions/${id}`).update({
            rejected: true
        });
        errorMessage("Duplicate data!", values.name);
    }
}
async function sendParamCheck(values, submittedOn, id) {
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
        if (data.values.borrower === values.name && category === "borrow") {
            totalSending += parseFloat(data.values.amount);
        }
        if (data.values.get_from === values.name && category === "borrow") {
            totalSending -= parseFloat(data.values.amount);
        }
    }

    totalSending += parseFloat(values.amount);

    if (balance < totalSending) {
        await admin.firestore().doc(`pending_transactions/${id}`).update({
            rejected: true
        });
        errorMessage("Insufficient Funds!", values.initiator);
    }
}

async function assertInputsAreCorrect(query) {
    for (let i = 0; i < query.size; i++) {
        const doc = query.docs[i];
        const data = doc.data();
        const id = doc.id;
        if (data.values.replaced) throw new Error("Expected replaced to be false for: " + data);
        if (data.values.category === "sales") await saleParamCheck(data, id);
        else if (data.values.category === "buys") await buyParamCheck(data.values, data.submittedOn, id);
        else if (data.values.category === "borrow") await borrowParamCheck(data.values, data.submittedOn, id);
        else if (data.values.category === "send") await sendParamCheck(data.values, data.submittedOn, id);
    }
    for (let i = 0; i < query.size; i++) {
        const doc = query.docs[i];
        const data = doc.data();
        const id = doc.id;
        if (data.values.category === "sales"
            && !data.values.replaced) {
            //burns eggs
            const done = await updateEggs(data, id);
            if (!done) throw new Error("Burning eggs failed");
        }
    }
}

function getDateString(myDate) {
    return ('0' + myDate.getDate()).slice(-2) + '/'
        + ('0' + (myDate.getMonth()+1)).slice(-2) + '/'
        + myDate.getFullYear();
}

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
    const accepted = ["PURITY", "JEFF", "VICTOR", "BABRA", "ANNE", "BANK"];
    for (let i = 0; i < blockAll.size; i++) {
        const data = block[i].data();
        for (let p = 0; p < data.chain.length; p++) {
            for (let k = 0; k < data.chain[p].transactions.length; k++) {
                const reason = data.chain[p].transactions[k].reason || '';
                const amount = data.chain[p].transactions[k].amount;
                const timeStamp = data.chain[p].transactions[k].timestamp;
                if (reason.substring(0, 5) === 'TRADE' || reason.substring(0, 4) === 'SELL') {
                    let to = reason.split(';');
                    to = to[to.length - 1].substring(3);
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
    all = all.slice(0, 5);
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
    let key = data.map(() => ranKey++);
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

const runtimeOptsDaily = {
    timeoutSeconds: 540,
    memory: '4GB'
}

/* function predictBags() {
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
} */

function predictEggs() {
    const url = "https://europe-west2-poultry101-6b1ed.cloudfunctions.net/predict-eggs";

    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            console.log(xhr.status);
            if (parseInt(xhr.status) !== 200) throw new Error("Request wasn't successful: "+xhr.status);
            console.log("RESPONSE", xhr.responseText);
            const resJson = JSON.parse(xhr.responseText);
            const length = Object.keys(resJson).length;
            if (length < 1) throw new Error("Invalid length returned: "+length);
            let date_ = new Date(resJson[`${length-1}`].ds);
            console.log("DATE SELECTED:", date_.toDateString());
            date_.setHours(0, 0, 0, 0);
            if (!date) throw new Error("date is undefined; date: " + date_);
            return admin.firestore().doc('trays/current_trays')
                .update({
                    today: date_,
                    response: resJson,
                    submittedOn: admin.firestore.FieldValue.serverTimestamp()
                });
        }
    };

    admin.firestore().doc('trays/current_trays')
        .get().then((doc) => {
        const data = doc.data();
        const toSend = `{"message":"${data.trend}"}`
        console.log("DATA:", toSend);
        xhr.send(toSend);
    });
    return 0;
}

function predictProfit() {
    const url = "https://europe-west2-poultry101-6b1ed.cloudfunctions.net/predict-profit";

    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);

    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            console.log(xhr.status);
            if (xhr.status !== 200) throw new Error("Request failed with status code: "+xhr.status);
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
            if (data.docId.startsWith('WITHDRAWN_')) continue;
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
    return 0;
}

const runtimeOptWeekly = {
    timeoutSeconds: 540,
    memory: '8GB'
}

async function updateEggsTrend() {
    const query = await admin.firestore().collection('eggs_collected')
        .orderBy('date_', 'asc').get();
    const dates = [];
    const values = [];
    let firstDate;
    let i = 0;
    query.forEach((doc) => {
        const data = doc.data();
        const date_ = new Date(parseInt(data.date_));
        const value = safeTrayEggConvert(data.trays_store, true);
        values.push(value);
        dates.push(getDateString(date_));
        if (!firstDate && i === query.size-1) firstDate = date_.getTime();
        i++;
    });
    if (dates.length !== values.length) throw new Error("Dates and values not equal");
    if (!firstDate) throw new Error("First date undefined");
    let period = new Date().getTime() - firstDate;
    period = Math.floor(period / 86400000);
    const trend = `${dates.toString()};${values.toString()}$$${period}`;
    return admin.firestore().doc('trays/current_trays').update({
        trend,
        submittedOn: admin.firestore.FieldValue.serverTimestamp()
    });
}

exports.eggTrend = functions.region('europe-west2').pubsub
    .schedule('every 1 hours from 17:00 to 18:00')
    .timeZone('Africa/Nairobi').onRun(() => {
        estimatedTrays(false);
        return dailyCurrentTraysCheck();
    });

exports.dailyChanges = functions.runWith(runtimeOptsDaily).region('europe-west2').pubsub
    .schedule('every 1 hours from 02:00 to 03:00')
    .timeZone('Africa/Nairobi').onRun(() => {
        dailyUpdateBags();
        updateEggsTrend();
        predictEggs();
        return updateTxList();
    });

function callTrayFinder(sending) {
    const url = "https://europe-west2-poultry101-6b1ed.cloudfunctions.net/findCauseTray";

    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            console.log(xhr.status);
            if (parseInt(xhr.status) !== 200) throw new Error("Request wasn't successful: "+xhr.status);
            const resJson = JSON.parse(xhr.responseText);
            console.log("RESPONSE", resJson);
            admin.firestore().doc('temp/err_trays').set({ resJson, submittedOn: admin.firestore.FieldValue.serverTimestamp() });
        }
    };
    console.log(sending);
    const toSend = `{"message":"${sending}"}`
    console.log("DATA:", toSend);
    xhr.send(toSend);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function findCausedTray(needed) {
    const query = await admin.firestore().collection('pending_transactions')
        .get();
    let docs = [];
    const trayId = new Map();
    query.forEach((doc) => {
        if (doc.id === 'cleared') return 0;
        if (!doc.data().values.trayNo) return 0;
        docs.push({id: doc.id, data: doc.data().values});
        trayId.set(parseInt(doc.data().values.trayNo), doc.id);
    });
    let trayNo = [];
    for (let i = 0; i < docs.length; i++) {
        trayNo.push(parseInt(docs[i].data.trayNo));
    }
    callTrayFinder(trayNo.toString()+';'+needed.toString());
    let found = false;
    let n = 0;
    let combination = [];
    const maxTrays = Math.max(...trayNo);
    while (!found) {
        let combinationFound = await admin.firestore().doc('temp/err_trays').get();
        if (combinationFound.exists) {
            combinationFound = combinationFound.data();
            combination = combinationFound.resJson;
            let temp = combination;
            let test = 0;
            if (combination.length !== 0) test = temp.reduce((a, b) => a + b, 0);
            if (test !== needed) {
                console.log("wait", n);
                await sleep(2000);
            } else {
                found = true;
            }
        } else {
            console.log("wait", n);
            await sleep(2000);
        }
        n++;
        if (n > 10) break;
    }
    if (!found) {
        if (maxTrays >= needed) {
            console.log("MARKED:", trayId.get(maxTrays));
            await admin.firestore().doc(`pending_transactions/${trayId.get(maxTrays)}`).update({
                rejected: true
            });
        } else {
            trayId.forEach((value) => {
                console.log("MARKED ALL:", value);
                admin.firestore().doc(`pending_transactions/${value}`).update({
                    rejected: true
                });
            })
        }
        console.log('No combination exists');
        return 'No combination exists';
    }
    const ids = [];
    for (let i = 0; i < docs.length; i++) {
        for (const x in combination) {
            if (combination[x] === parseInt(docs[i].data.trayNo)) {
                ids.push(docs[i].id);
            }
        }
    }
    console.log("IDS FOUND:", ids);
    for (const x in ids) {
        if (!ids.hasOwnProperty(x)) continue;
        console.log("MARKED:", ids[x]);
        await admin.firestore().doc(`pending_transactions/${ids[x]}`).update({
            rejected: true
        });
    }
}

async function movePendEggs() {
    const query = await admin.firestore().collection('pend_eggs_collected')
        .orderBy('date_', 'asc').get();
    const lastQuery = await admin.firestore().collection('eggs_collected')
        .orderBy('date_', 'desc').limit(1).get();
    if (query.size === 0 || lastQuery.size === 0) return 0;
    return lastQuery.forEach((lastDoc) => {
        let expectedPrevDate = lastDoc.data().date_;
        let oneDay = 86400000;
        return query.forEach((doc) => {
            const data =  doc.data();
            let foundPrevDate = data.date_ - oneDay;
            if (expectedPrevDate !== foundPrevDate) {
                console.log("MARKED:", doc.id);
                return admin.firestore().doc(`pend_eggs_collected/${doc.id}`).update({
                    rejected: true
                }).then(() => {
                    const er = new Error("UNMATCHED DATES: expected "+expectedPrevDate+" but was: "+foundPrevDate);
                    console.error(er);
                    throw er;
                });
            } else {
                async function cleanup() {
                    await admin.firestore().collection('eggs_collected').add({
                        ...data
                    })
                    await doc.ref.delete();
                    await sleep(5000);
                    expectedPrevDate += oneDay;
                }
                return cleanup();
            }
        });
    });
}

exports.moveEggs = functions.region('europe-west2')
    .pubsub.schedule('every 1 hours from 01:00 to 02:00')
    .timeZone('Africa/Nairobi').onRun(() => {
        return movePendEggs();
    });

/**
 * eggsChange function always has to run earlier than wakeUpMiner function to prevent
 * situation where trays are sold on the same day they where collected and no
 * trays to burn are available in the linked list to accommodate the transaction.
 */
const miningOpts = {
    timeoutSeconds: 540,
    memory: '8GB'
}
exports.wakeUpMiner = functions.runWith(miningOpts).region('europe-west2')
    .pubsub.schedule('every 1 hours from 03:00 to 04:00')
    .timeZone('Africa/Nairobi').onRun(() => {
        return admin.firestore()
            .collection("pending_transactions")
            .orderBy("submittedOn", "asc")
            .get()
            .then(async (query) => {
                if (query.size === 0) return 0;
                let totalTraysToSell = 0;
                query.forEach((doc) => {
                    const data = doc.data();
                    if (data.values.category === "sales") totalTraysToSell += parseInt(data.values.trayNo);
                });
                const trayDoc = await admin.firestore().doc('trays/current_trays').get()
                const _data = trayDoc.data();
                const currentTrays = parseInt(_data.current.split(',')[0]);
                if ((currentTrays - totalTraysToSell) < 0) {
                    const difference = totalTraysToSell - currentTrays;
                    console.log("DIFF:", difference);
                    await findCausedTray(difference);
                    const errMess = "Trays not enough to complete transactions";
                    await admin.firestore().doc('temp/temp').update({ errMess, submittedOn: admin.firestore.FieldValue.serverTimestamp() })
                    errorMessage(errMess, 'JEFF');
                    throw new Error(errMess);
                }
                await admin.firestore().doc('temp/err_trays').delete();
                await admin.firestore().doc('temp/temp').update({errMess: '', submittedOn: admin.firestore.FieldValue.serverTimestamp() });
                initializeMap();
                await calculateBalance();
                await assertInputsAreCorrect(query);
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
                            if (data.values.section !== "THIKA_FARMERS" && data.values.section !== "DUKA") {
                                const tx2 = new Transaction(users.get(USERS.MINER),
                                    users.get(data.values.name), total,
                                    actions.SELL.concat(";").concat(data.values.section, ";").concat(data.values.buyerName,
                                        ";FROM:", USERS.MINER, ";TO:", data.values.name),
                                    replaced, data.values.date.toDate().toDateString());
                                tx2.signTransaction(users.get(USERS.MINER.concat("_pr")));
                                viczcoin.addTransaction(tx2);
                            } else if (data.values.section === "DUKA") {
                                const tx2 = new Transaction(users.get(USERS.MINER),
                                    users.get("JEFF"), total,
                                    actions.SELL.concat(";").concat(data.values.section, ";").concat(data.values.buyerName,
                                        ";FROM:", USERS.MINER, ";TO:", "JEFF"),
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
                                await createNotification(notification);
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
                console.log("mining done!");
                return 0;
        });
});

exports.predictPft = functions.runWith(runtimeOptWeekly).region('europe-west2')
    .pubsub.schedule('every sunday 01:00').timeZone('Africa/Nairobi').onRun((() => {
        return predictProfit();
    }));

exports.weeklyChanges = functions.runWith(runtimeOptWeekly).region('europe-west2')
    .pubsub.schedule('every sunday 02:00').timeZone('Africa/Nairobi').onRun((() => {
    weeklyChickenAgeUpdate();
    weeklyExportFirestore();
    const sunday = new Date();
    sunday.setHours(0, 0, 0, 0);
    return admin.firestore().collection('profit')
        .add({
            docId: date.toLocaleDateString('en-US', {timeZone: 'Africa/Nairobi'}),
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
}));

async function updateMonthlyRev() {
    const buyGross = await admin.firestore().doc('stats/data_buys')
        .get();
    const saleGross = await admin.firestore().doc('stats/data_sales')
        .get();
    const saleGrossVal = saleGross.data().totalAmountEarned;
    const buyGrossVal = buyGross.data().totalAmountSpent;
    await saleGross.ref.set({
        prevMonth: saleGrossVal,
        submittedOn: admin.firestore.FieldValue.serverTimestamp(),
        totalAmountEarned: 0
    }, { merge: true });
    await buyGross.ref.set({
        prevMonth: buyGrossVal,
        submittedOn: admin.firestore.FieldValue.serverTimestamp(),
        totalAmountSpent: 0
    }, {merge: true});
    return 0;
}

exports.monthlyChanges = functions.pubsub
    .schedule('1 of month 01:00').onRun((() => {
    monthlyJeffDebt();
    return updateMonthlyRev();
}));

function predictEggsCumulate() {
    const url = "https://europe-west2-poultry101-6b1ed.cloudfunctions.net/predict-eggs-cumulate";

    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            console.log(xhr.status);
            if (parseInt(xhr.status) !== 200) throw new Error("Request wasn't successful: "+xhr.status);
            console.log("RESPONSE", xhr.responseText);
            const resJson = JSON.parse(xhr.responseText);
            const length = Object.keys(resJson).length;
            if (length < 1) throw new Error("Invalid length returned: "+length);
            return admin.firestore().doc('trays/current_trays')
                .update({
                    cumulative: resJson,
                    submittedOn: admin.firestore.FieldValue.serverTimestamp()
                });
        }
    };

    return admin.firestore().doc('trays/current_trays')
        .get().then((doc) => {
        const data = doc.data();
        const toSend = `{"message":"${data.trend}"}`
        console.log("DATA:", toSend);
        xhr.send(toSend);
    });
}

exports.eggsFurther = functions.runWith(runtimeOptsDaily).region('europe-west2').pubsub
    .schedule('every 1 hours from 02:00 to 03:00')
    .timeZone('Africa/Nairobi').onRun(() => {
        return predictEggsCumulate();
    });

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
