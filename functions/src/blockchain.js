const { Transaction } = require('./transaction');
const { SHA512, actions } = require('./constants');
const { performance } = require('perf_hooks');
const admin = require('firebase-admin');

class Blockchain {
    constructor(minerWallet, minerReward, prevHash, difficulty) {
            this.difficulty = difficulty;
            this.pendingTransactions = [];
            this.miningReward = minerReward;
            this.minerWallet = minerWallet;
            this.chain = [];
            this.chain = [this.createGenesisBlock()];
            this.prevHash = prevHash;
    }

    createGenesisBlock() {
        const genesisReward = new Transaction(null, this.minerWallet, this.miningReward);
        this.pendingTransactions.push(genesisReward);
        let block = new Block(new Date().toDateString(), this.pendingTransactions, this.prevHash);
        block.mineBlock(this.difficulty);
        this.pendingTransactions = [];
        this.miningReward = -50;
        return block
    }

    getLatestBlock() { return this.chain[this.chain.length - 1]; }

    minePendingTransactions() {
        console.log(this.pendingTransactions.length+" transactions are in this block...");
        const rewardTx = new Transaction(null, this.minerWallet, this.miningReward, actions.REWARD);
        this.pendingTransactions.push(rewardTx);

        let block = new Block(new Date().toDateString(), this.pendingTransactions, this.getLatestBlock().hash);
        console.log('mining block...');
        block.mineBlock(this.difficulty);

        console.log('Block successfully mined!');
        this.chain.push(block);
        this.pendingTransactions = [];
        console.log("current block chain length: "+this.chain.length);
    }

    addTransaction(transaction) {

        if (!transaction.fromAddress || !transaction.toAddress) {
            throw new Error('Transaction must include from and to address');
        }

        if (!transaction.isValid()) {
            throw new Error('Cannot add invalid transaction to chain');
        }

        this.pendingTransactions.push(transaction);
    }

    getBalanceOfAddress(address) {
        let balance = 0;

        for(const block of this.chain) {
            for (const trans of block.transactions) {
                if (trans.fromAddress === address) {
                    balance -= trans.amount;
                }

                if (trans.toAddress === address) {
                    balance += trans.amount;
                }
            }
        }
        return balance;
    }

    isChainValid() {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i-1];

            if (!currentBlock.hasValidTransactions()) {
                return false;
            }
            if (currentBlock.hash !== currentBlock.calculateHash()) {
                return false;
            }
            if (currentBlock.previousHash !== previousBlock.hash) {
                return false;
            }
        }

        return true;

    }
}

class Block {
    constructor(timestamp, transactions, previousHash = '') {
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.previousHash = previousHash;
        this.hash = this.calculateHash();
        this.nonce = 0;
    }

    calculateHash() {
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
        const myFlattenedObj = flattenObject(this.transactions);
        const str = this.previousHash + this.timestamp + JSON.stringify(myFlattenedObj, Object.keys(myFlattenedObj).sort()) + this.nonce;
        return SHA512(str).toString();
    }

    mineBlock(difficulty) {
        const startTime = performance.now();
        console.log("DIFFICULTY TO BE USED:", difficulty);
        while (this.hash.substring(0, difficulty) !== Array(difficulty+1).join("0")) {
            this.nonce++;
            this.hash = this.calculateHash();
        }
        const endTime = performance.now();
        const totalTime = (endTime - startTime) / 1000;// time took to run in milliseconds
        console.log('Total time:'+totalTime +' s');
        if (totalTime > 47) {
            let rand = Math.random();
            if (rand >= 0.5) {
                admin.firestore().doc('temp/difficulty').update({
                    diff: admin.firestore.FieldValue.increment(-1),
                    submittedOn: admin.firestore.FieldValue.serverTimestamp()
                });
            } else if (difficulty > 4) {
                admin.firestore().doc('temp/difficulty').update({
                    diff: admin.firestore.FieldValue.increment(-1),
                    submittedOn: admin.firestore.FieldValue.serverTimestamp()
                });
            }
        } else {
            let rand = Math.random();
            if (difficulty > 4) {
                admin.firestore().doc('temp/difficulty').update({
                    diff: admin.firestore.FieldValue.increment(-1),
                    submittedOn: admin.firestore.FieldValue.serverTimestamp()
                });
            } else if (rand < 0.5) {
                admin.firestore().doc('temp/difficulty').update({
                    diff: admin.firestore.FieldValue.increment(1),
                    submittedOn: admin.firestore.FieldValue.serverTimestamp()
                });
            }
        }
        if (this.previousHash === "genesis_block") console.log("genesis block mined!");
        else console.log("Block mined: " + this.hash);
    }

    hasValidTransactions() {
        for (const tx of this.transactions) {
            if (!tx.isValid()) {
                return false;
            }
        }
        return true;
    }

}

module.exports.Blockchain = Blockchain;
