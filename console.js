/*
- CUM COIN JS
- Created By DwifteJB and Thunder7
*/
const fs = require("fs");
const api = require("./src/modules/api.js");
const prompts = require('prompts');
const crypto = require("crypto");
const accounts = require("./src/db/models/Account.js")
const Transaction = require("./src/db/models/Transactions")
const CC = new api.Blockchain()
const debug = new api.debug();
// FUNCTIONS
function register() {
    (async () => {
        console.log("Register")
        const info = await prompts(
            [
                {
                    type: 'text',
                    name: 'username',
                    message: 'Enter your Username'
                },
                {
                    type: 'text',
                    name: 'password',
                    message: 'Enter your password'
                },
                {
                    type: 'text',
                    name: 'email',
                    message: 'Enter your email'
                }
            ]);
        if (await api.getWallet(info.username) !== false) { return console.log(`Account ${info.username} already exists.`)}
        console.log("Generating wallet...")
        const wallet = await api.generateWallet(info.password, info.username, info.email);
        console.log("Wallet created!");
        login();
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
        debug.accountWindow(info,account.dataValues)
    })();
}
login();
// api.SendCoin(CC, "86c60c58f0ee287101fe05be2a97fc06f0207173c298af7385f6fe6ae2a9487f", "1ef7defff7c23dde94fa3d17eff6b00132329788ebbb845fab32860d0e7cffac", "For CashApp Help", 1)