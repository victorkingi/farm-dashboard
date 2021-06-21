const admin = require('firebase-admin');
const functions = require('firebase-functions');

const AllTopic = 'ALL_USERS';
const adminTopic = 'ADMIN_USERS';

function unsubscribeFromTopics(myToken, myTopic) {
    return admin.messaging().unsubscribeFromTopic(myToken, myTopic).then((response) => {
        return console.log('Successfully unsubscribed from topic: ', response);
    }).catch(err => {
        return console.error("error occurred unsubscribing, ", err)
    });
}

function subscribeToTopics(myToken, myTopic) {
    return admin.messaging().subscribeToTopic(myToken, myTopic).then((response) => {
        return console.log('Successfully subscribed to topic: ', response);
    }).catch(err => {
        return console.error("error occurred, ", err)
    });
}

exports.handleTokens = functions.firestore.document('notify_token/{docId}/tokens/{tokenId}')
    .onWrite( (change, context) => {
        const batch = admin.firestore().batch();
        const countDocRef = admin.firestore().collection('notify_token')
            .doc(context.params.docId).collection('tokens').doc('count');
        const prevData = change.before.data() || null;
        const newData = change.after.data() || null;
        const token = context.params.tokenId;

        if ("count" === token) {
            return 0;
        }
        if (prevData === null && newData) {
            //register new token
            const email = newData.email;

            batch.update(countDocRef, {
                total: admin.firestore.FieldValue.increment(1),
                submittedOn: admin.firestore.FieldValue.serverTimestamp()
            });

            admin.auth().getUserByEmail(email).then((userRecord) => {
                if (userRecord.customClaims['admin']) {
                    return subscribeToTopics(token, adminTopic);
                }
                return null;
            }).catch((err) => {
                return console.error(err);
            });

            subscribeToTopics(token, AllTopic);
            return batch.commit();
        } else if (newData === null && prevData) {
            //unsubscribe token

            const email = prevData.email;

            batch.update(countDocRef, {
                total: admin.firestore.FieldValue.increment(-1),
                submittedOn: admin.firestore.FieldValue.serverTimestamp()
            });

            admin.auth().getUserByEmail(email).then((userRecord) => {
                if (userRecord.customClaims['admin']) {
                    return unsubscribeFromTopics(token, adminTopic);
                }
                return null;
            }).catch((err) => {
                return console.error(err);
            });
            unsubscribeFromTopics(token, AllTopic);
            return batch.commit();
        }
        return null;
    })
