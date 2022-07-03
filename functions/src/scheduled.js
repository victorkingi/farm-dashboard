const admin = require('firebase-admin');
const functions = require('firebase-functions');
const firestore = require('@google-cloud/firestore');
const client = new firestore.v1.FirestoreAdminClient();
const bucket = 'gs://poultry101-6b1ed-firestore-backup';

const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const numeral = require('numeral');
const date = new Date();

const nacl = require('tweetnacl');
const {estimatedTrays} = require("./utils");
nacl.util = require('tweetnacl-util');

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
        return console.log(`Operation Name: ${response['name']}`);

    }).catch(err => {
        console.error(err);
        const details = {
            title: `database export failed`,
            body: `Check console for more details`,
            name: "VICTOR"
        }
        throw new Error(`Export operation failed: ${err.message}`);
    });
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

const runtimeOptsDaily = {
    timeoutSeconds: 540,
    memory: '4GB'
}

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
    let largestMarked = false;
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
            largestMarked = true;
        } else {
            const mapTray = new Map([...trayId.entries()].sort());
            let all = 0;
            let isDone = false;
            mapTray.forEach((value, key) => {
                if (isDone) return 0;
                console.log("MARKED ALL:", value);
                admin.firestore().doc(`pending_transactions/${value}`).update({
                    rejected: true
                });
                all += key;
                if (all >= needed) isDone = true;
            });
            largestMarked = false;
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
    const notification = {
        content: 'Insufficient gas',
        extraContent: 'Marked txs causing failure',
        identifier: 'tray',
        user: 'MINER',
        time: admin.firestore.FieldValue.serverTimestamp(),
    }
}

const miningOpts = {
    timeoutSeconds: 540,
    memory: '8GB'
}

exports.execute = functions.runWith(miningOpts).region('europe-west2')
    .pubsub.schedule('every 1 hours from 03:00 to 04:00')
    .timeZone('Africa/Nairobi').onRun(() => {
});

exports.predictPft = functions.runWith(runtimeOptWeekly).region('europe-west2')
    .pubsub.schedule('every sunday 01:00').timeZone('Africa/Nairobi').onRun((() => {
        return predictProfit();
    }));

exports.weeklyChanges = functions.runWith(runtimeOptWeekly).region('europe-west2')
    .pubsub.schedule('every sunday 02:00').timeZone('Africa/Nairobi').onRun((() => {
    weeklyExportFirestore();
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
