/*
- CumCoin API
- Developed by DwifteJB and Thunder7
*/
const SHA256 = require("crypto-js/sha256");
const fs = require("fs");
const crypto = require('crypto');
const blessed = require("blessed");
const contrib = require('blessed-contrib');
(async () => {
    function getWallet(password,username) {
        return new Promise((resolve,reject) => {
            const accounts = JSON.parse(fs.readFileSync("./src/data/wallets.json"));
            for(index in accounts) {
                if (accounts[index][username]) {
                    return resolve(accounts[index][username]);
                }
            }
            return resolve(false);
        })
    }
    function generateWallet(password, username) {
        return new Promise((resolve, reject) => {
            const { generateKeyPair } = require('crypto');
            generateKeyPair('rsa', {
            modulusLength: 4096,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem'
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem',
                cipher: 'aes-256-cbc',
                passphrase: password
            }
            }, (err, publicKey, privateKey) => {
                const key = {
                    [username]: {
                        "privatekey": privateKey,
                        "publickey": publicKey,
                        "password": password
                    }
                }
                const wallets = JSON.parse(fs.readFileSync("./src/data/wallets.json"))
                wallets.push(key);
                // add key to wallets.json
                fs.writeFileSync("./src/data/wallets.json", JSON.stringify(wallets,null,4))
                resolve(key);
            });
        });
    }
    class debug {
        accountWindow(info,account) {
            var screen = blessed.screen({
                smartCSR: true
              });
              
            screen.title = 'CCoin Account';
            screen.key(['escape', 'q', 'C-c'], function(ch, key) {
                return process.exit(0);
            });
            const box = blessed.box({
                label:'Your Account', 
                content: `Username: ${info.username}\nWallet: ${SHA256(account.private_key)}\nAmount: eta`,
                top: 'center',
                left: 'center',
                width: '75%',
                height: '75%',
                border: {
                    type: 'line'
                  },
                style: {
                    fg: 'white',
                    border: {
                        fg: '#f0f0f0'
                    }
                }
            });
            screen.append(box)
            screen.render();
              
        }
    }
    class BlockCrypto {
        getTimestamp() {
            const pad = (n,s=2) => (`${new Array(s).fill(0)}${n}`).slice(-s);
            const d = new Date();
            
            return `${pad(d.getFullYear(),4)}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
        }
        constructor(index, info, nextHash = " ") {
        this.index = index;
        this.current_time = this.getTimestamp();
        this.info = info;
        this.nextHash = nextHash;
        this.hash = this.computeHash();
        }
    
        computeHash() {
        return SHA256(
            this.index +
            this.nextHash +
            this.current_time +
            JSON.stringify(this.info)
                ).toString();
        }
    }
    
    class Blockchain {
        constructor() {
            this.block1chain = [this.initGenesisBlock()];
            this.difficulty = 4;
        }
        initGenesisBlock() {
            return JSON.parse(fs.readFileSync("./src/data/transactions.json"))
        }

        obtainLatestBlock() {
            return this.block1chain[this.block1chain.length - 1];
        }
        addNewBlock(newBlock) {
            newBlock.nextHash = this.obtainLatestBlock().hash;
            newBlock.hash = newBlock.computeHash();
                this.block1chain.push(newBlock);
                fs.writeFileSync("./src/data/transactions.json",JSON.stringify(this.block1chain,null,4));
                
        }

        checkChainValidity() {
            for (let i = 1; i < this.block1chain.length; i++) {
            const currentBlock = this.block1chain[i];
            const nextHash = this.block1chain[i - 1];

            if (currentBlock.hash !== currentBlock.computeHash()) {
                return false;
            }
            if (currentBlock.nextHash !== nextHash.hash) return false;
            }
            return true;
        }
    }

    module.exports = {generateWallet, BlockCrypto, Blockchain, getWallet, debug}
})();