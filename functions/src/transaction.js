const {SHA512, ec} = require('./constants');

class Transaction {
    constructor(fromAddress, toAddress, amount, reason, replaced, timestamp) {
        this.fromAddress = fromAddress;
        this.toAddress = toAddress;
        this.amount = amount;
        this.reason = reason === undefined ? "" : reason;
        this.signature = '';
        this.replaced = replaced === undefined ? "" : replaced;
        this.timestamp = timestamp === undefined ? "" : timestamp;
        this.hashTx = ''
    }

    calculateHash() {
        this.hashTx = SHA512(this.fromAddress + this.toAddress + this.amount
            + this.reason + this.replaced + this.timestamp).toString();
        return this.hashTx;
    }

    signTransaction(signingKey) {
        const key = ec.ellipticCurve.keyFromPrivate(signingKey);
        const pubKey = key.getPublic('hex');
        if (pubKey !== this.fromAddress) {
            throw new Error('You cannot sign transactions from other wallets!');
        }

        const hashTx = this.calculateHash();
        const sig = key.sign(hashTx, 'base64');
        this.signature = sig.toDER('hex');
    }

    isValid() {
        if (this.fromAddress === null) return true;

        if (!this.signature || this.signature.length === 0) {
            throw new Error('No signature in this transaction');
        }

        const publicKey = ec.ellipticCurve.keyFromPublic(this.fromAddress, 'hex');
        return publicKey.verify(this.calculateHash(), this.signature);
    }
}

module.exports.Transaction = Transaction;
