const admin = require('firebase-admin');
const {safeTrayEggConvert} = require("./helper");

module.exports = {
    estimatedTrays: async (isRealtimeCall) => {
        const doc = await admin.firestore().doc('trays/current_trays').get();
        const data = doc.data();
        const response = data.response;
        const current = data.current;
        const curEggs = safeTrayEggConvert(current, true);
        if (!response) return -1;
        let totalEggs = curEggs;
        console.log("initial eggs", totalEggs);
        for (const [, value] of Object.entries(response)) {
            let eggs  = parseInt(value['yhat']);
            console.log("adding", eggs);
            totalEggs += eggs;
        }
        console.log("final eggs", totalEggs);
        const estimate = safeTrayEggConvert(totalEggs, false);
        if (isRealtimeCall) {
            return estimate;
        } else {
            return admin.firestore().doc('trays/current_trays')
                .update({
                    estimate,
                    predictedOn: admin.firestore.FieldValue.serverTimestamp()
                });
        }
    }
}

