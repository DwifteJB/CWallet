/*
- CUM COIN JS
- Created By DwifteJB and Thunder7
*/
const SHA256 = require("crypto-js/sha256");

const fs = require("fs");
const api = require("./src/modules/api.js");
const prompts = require('prompts');
const crypto = require("crypto");
const accounts = require("./src/db/models/Account.js")
const CC = new api.Blockchain()
const debug = new api.debug();
// FUNCTIONS
function register() {
    (async () => {
        console.log("Register")
        const info = await prompts([{type: 'text',name: 'username',message: 'Enter your Username'},{type: 'text',name: 'password',message: 'Enter your password'}]);
        if (await api.getWallet(info.username) == false) { return console.log(`Account ${info.username} already exists.`)}
        console.log("Generating wallet...")
        const wallet = await api.generateWallet(info.password, info.username);
        console.log("Wallet created!");
    })();
}

function login() {
    (async () => {
        console.log("Login")
        const info = await prompts([{type: 'text',name: 'username',message: 'Enter your Username'},{type: 'text',name: 'password',message: 'Enter your password'}])
        const account = await api.getWallet(info.username);
        if (account === false) {
            return console.log("Account " + info.username + " not found.")
        }
        if (account.password !== info.password) {
            return console.log(`Failed to login to ${info.username}.`)
        }
        debug.accountWindow(info,account)
        //console.log(api.getWalletBalance(info.username))
    })();
}
// CC.addNewBlock(
//     new api.BlockCrypto(1, {
//       sender: "1ef7defff7c23dde94fa3d17eff6b00132329788ebbb845fab32860d0e7cffac",
//       recipient: "89a09ff4366e90824da2fa50f228a227842de33538c2130a412e42536ac416df",
//       quantity: 20
//     })
// );
login();