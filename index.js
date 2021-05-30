/*
- CUM COIN JS
- Created By DwifteJB and Thunder7
*/
const SHA256 = require("crypto-js/sha256");

const fs = require("fs");
const api = require("./src/modules/api.js");
const prompts = require('prompts');
const crypto = require("crypto");
const CC = new api.Blockchain()
const debug = new api.debug();
// FUNCTIONS
function register() {
    (async () => {
        console.log("Register")
        const info = await prompts([{type: 'text',name: 'username',message: 'Enter your Username'},{type: 'text',name: 'password',message: 'Enter your password'}])
        const wallets = JSON.parse(fs.readFileSync("./src/data/wallets.json"))
        for(index in wallets) {
            if (wallets[index][info.username]) {
                console.log("User " + info.username + " already exists.")
                return;
            }
        }
        console.log("Generating wallet...")
        const wallet = await api.generateWallet(info.password,info.username);
        console.log("Wallet created!");  
    })();
}
function login() {
    (async () => {
        console.log("Login")
        const info = await prompts([{type: 'text',name: 'username',message: 'Enter your Username'},{type: 'text',name: 'password',message: 'Enter your password'}])
        const account = await api.getWallet(info.password,info.username);
        if (account == false) {
            return console.log("Account " + info.username + " not found.")
        }
        debug.accountWindow(info,account)
    })();
}
// const wallet =  api.generateWallet(150);
// CC.addNewBlock(
//     new api.BlockCrypto(1, "06/04/2021", {
//       sender: "Robbie Morgan",
//       recipient: "Thundercock",
//       quantity: 20
//     })
// );


// console.log(wallet);
// console.log(JSON.stringify(CC, null, 4));


// CC.addNewBlock(
//     new api.BlockCrypto(1, {
//       sender: "1ef7defff7c23dde94fa3d17eff6b00132329788ebbb845fab32860d0e7cffac",
//       recipient: "89a09ff4366e90824da2fa50f228a227842de33538c2130a412e42536ac416df",
//       quantity: 20
//     })
// );


login();