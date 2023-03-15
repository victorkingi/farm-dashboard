import Localbase from "localbase";
import SHA256 from "crypto-js/sha256";
import MerkleTree from "merkletreejs";

export const inputDeadSick = (deadSick, image) => {
    return (dispatch, getState, {getFirebase, getFirestore}) => {
        //make async call to database
        const firestore = getFirestore();
        const firebase = getFirebase();
        const user = firebase.auth().currentUser.displayName;
        const name = user.substring(0, user.lastIndexOf(" ")).toUpperCase();

        let values = {
            ...deadSick,
            submitted_by: name,
            url: '',
            file_name: `${deadSick.section.toUpperCase()}_${image.name}`,
            submitted_on: new Date()
        }
        let newDate = values.date;
        newDate.setHours(0, 0, 0, 0);
        values.date = newDate;

        let hash = `${parseInt(values.date.getTime()/1000)}${values.section}${values.level}`.toUpperCase();
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
                    const reader = new FileReader();
                    const db = new Localbase('imageUpload');
                    reader.addEventListener('load', () => {
                        let view = new Uint8Array(reader.result);
                        return db.collection('dead_sick').add({
                            image: view,
                            file_name: `${deadSick.section.toUpperCase()}_${image.name}`,
                            time: new Date().getTime()
                        }).then(() => {
                            console.log("doc added to local");
                            firestore.collection('pending_upload')
                                .doc(hash).set({ values });

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
                        });
                    });
                    reader.readAsArrayBuffer(image);
                }
            });
        } else {
            console.log("lock being used");
            return Promise.resolve('LOCK');
        }
    }
}
