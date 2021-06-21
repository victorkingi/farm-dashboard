const secp256k = require('elliptic-curve').secp256k1;

const actions = {
    SELL: "SELL",
    BUY: "BUY",
    TRADE: "TRADE",
    REWARD: "REWARD"
};

const users = {
    MINER: 'MINER',
    VICTOR: 'VICTOR',
    JEFF: 'JEFF',
    ANNE: 'ANNE',
    THIKA_FARMERS: 'THIKA_FARMERS',
    BABRA: 'BABRA',
    PURITY: 'PURITY',
    BANK: 'BANK',
    FEEDS: 'FEEDS',
    DRUGS: 'DRUGS',
    DUKA: 'DUKA',
    CAKES: 'CAKES',
    OTHER_PURITY: 'OTHER_PURITY',
    OTHER_SALE: 'OTHER_SALE',
    OTHER_BUY: 'OTHER_BUY',
}

module.exports.ec = secp256k;
module.exports.SHA512 = require('crypto-js/sha512');
module.exports.actions = actions;
module.exports.USERS = users;
