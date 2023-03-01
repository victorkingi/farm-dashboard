import SHA256 from "crypto-js/sha256";
import Localbase from "localbase";
import MerkleTree from "merkletreejs";

/**
 *
 * @returns {function(*, *, {getFirebase: *, getFirestore: *}): void}
 * @param values
 */
export const inputPurchase = (values) => {
    return (dispatch, getState, {getFirebase, getFirestore}) => {
        const firestore = getFirestore();
        console.log(values);
        let newDate = values.date;
        newDate.setHours(0, 0, 0, 0);
        values.date = newDate;

        let hash = `${values.item_name}${parseInt(values.date.getTime()/1000)}${values.section}`.toUpperCase();
        hash = SHA256(hash).toString();
        values.submitted_on = new Date();
        console.log("hash to use", hash);
        const lock = localStorage.getItem('LOCK');
        if (lock === null || lock === '0') {
            localStorage.setItem('LOCK', '1');
            const verDb = new Localbase('ver_data');

            return verDb.collection('hashes')
                .doc({ id: 1 }).get().then(document => {
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
                        if (JSON.parse(values.status)) {
                            firestore.collection('pending_transactions')
                                .doc(hash).set({
                                values
                            });
                            dispatch({type: 'INPUT_BUYING', values});
                        } else {
                            firestore.collection('late_payment').doc(hash).set({
                                values
                            });
                            dispatch({
                                type: 'INPUT_BUYING',
                                values
                            });
                        }

                        // add hash to local
                        return verDb.collection('hashes').doc({ id: 1 }).get().then(document => {
                            const leaves = document.hashes;
                            leaves.push(hash);

                            return verDb.collection('hashes').doc({ id: 1 }).update({
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
}
