import SHA256 from "crypto-js/sha256";
import MerkleTree from "merkletreejs";
import Localbase from "localbase";

/**
 *
 * @param eggs
 * @returns {(function(*, *, {getFirebase: *, getFirestore: *}): void)|*}
 */
export const inputTray = (eggs) => {
    return (dispatch, getState, {getFirebase, getFirestore}) => {
        const firebase = getFirebase();
        const firestore = getFirestore();
        const disName = firebase.auth().currentUser.displayName;
        const name =  disName.substring(0, disName.lastIndexOf(" ")).toUpperCase();
        let values = {
            ...eggs,
            submitted_by: name,
            submitted_on: new Date()
        }
        let newDate = values.date_;
        newDate.setHours(0, 0, 0, 0);
        values.date = newDate;
        delete values.date_;

        let hash = `${parseInt(values.date.getTime()/1000)}`.toUpperCase();
        hash = SHA256(hash).toString();
        console.log("hash to use", hash);
        const lock = localStorage.getItem('LOCK');
        if (lock === null || lock === '0') {
            localStorage.setItem('LOCK', '1');
            const verDb = new Localbase('ver_data');

            return verDb.collection('hashes')
                .doc('ver').get().then(document => {
                    const leaves = document.hashes;
                    const tree = new MerkleTree(leaves, SHA256);
                    const root = tree.getRoot().toString('hex');
                    const proof = tree.getProof(hash);
                    const isAvail = tree.verify(proof, hash, root);
                    console.log(isAvail);

                    if(isAvail) {
                        localStorage.setItem('LOCK', '0');
                        console.log("lock freed");
                        return true;
                    } else {
                        firestore.collection('pend_eggs_collected').doc(hash).set({
                            values
                        });
                        console.log('done');

                        // add hash to local
                        return verDb.collection('hashes').doc('ver').get().then(document => {
                            const leaves = document.hashes;
                            leaves.push(hash);

                            return verDb.collection('hashes').doc('ver').update({
                                hashes: leaves
                            }).then(() => {
                                console.log("trie updated");
                                localStorage.setItem('LOCK', '0');
                                console.log("lock freed");
                            });
                        });
                    }
                });
        } else {
            console.log("lock being used");
            return Promise.resolve('LOCK');
        }
    }
};
