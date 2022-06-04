/*
- CliveCoin API
- Developed by DwifteJB
*/
const {discordWebhook, defaultSettings} = require("../../config.json");
const PrivateApis = require("../apiPrivateKeys.json");
const SHA256 = require("crypto-js/sha256")
const fs = require("fs");
const crypto = require('crypto');
const blessed = require("blessed");
const accounts = require("../db/models/Account.js")
const Transaction = require("../db/models/Transactions.js")
const contrib = require('blessed-contrib');
const { Webhook, MessageBuilder } = require('discord-webhook-node');
(async () => {
    function addToWallet(blockchain, wallet,amount) {
        // creates a fake transaction for development
        return new Promise(async (resolve) => {
            await blockchain.addNewBlock(
                new this.BlockCrypto({
                    message: "Welcome Bonus",
                    sender: "CCoin",
                    recipient: wallet,
                    quantity: amount,
                    signature: "CCoin_Dev",
                    verified: true
                })
            )
            const embed = new MessageBuilder()
            .setTitle('CCoin sent a transaction')
            .addField('Recipient', wallet)
            .addField("Amount Sent", amount)
            .setColor('#008000')
            .setFooter('CCoin')
            .setTimestamp();
            this.sendToDiscord(discordWebhook,embed)
            //console.log(`---[ TRANSFER ]---------------------------------------------------------------- \nSender: ${sender}\nRecipient: ${recipient}\nQuantity: ${quantity}\nMessage: ${message}\n-------------------------------------------------------------------------------`);
            resolve(true);
        });
    }
    function sendToDiscord(webhook,embed) {
        new Webhook(webhook).send(embed)
    }
    function getAccountFromAuthToken(auth) {
        return new Promise(async (resolve) => {
            const account = await accounts.findOne({where:{cookie: auth}});
            if (account === null) {
                return resolve(false);
            }
            return resolve(account)
        })
    }
    function addAuthToken(account,auth) {
        return new Promise(async (resolve) => {
            account.cookie = auth
            await account.save();
            return resolve(true)
        })
    }
    function getAccountFromEmail(email) {
        return new Promise(async (resolve) => {
            const account = await accounts.findOne({where:{email: email}});
            if (account === null) {
                return resolve(false)
            }
            return resolve(account);
        })
    }
    async function SendCoin(blockchain, recipient, message, quantity, senderPrivKey, senderPubKey,) {
        const signature = await new Promise((resolve) => {
            let signature = crypto.sign("sha256", Buffer.from(recipient), {
                key: senderPrivKey,
                padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
            });
            resolve(signature)
        })
        const verified = crypto.verify(
            "sha256",
            Buffer.from(recipient),
            {
              key: senderPubKey,
              padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
            },
            signature
        );
        if (!verified === true) {
            const embed = new MessageBuilder()
            .setTitle(`We have failed to verify transaction`)
            .addField('Sender', this.getWalletHash(senderPubKey))
            .addField('Recipient', recipient)
            .addField("Message", message)
            .addField("Amount", quantity)
            .setColor('#FF0000')
            .setFooter('CCoin')
            .setTimestamp();
            this.sendToDiscord(discordWebhook,embed)
            return false
        }
        return new Promise(async (resolve) => {
            await blockchain.addNewBlock(
                new this.BlockCrypto({
                    message: message,
                    recipient: recipient,
                    sender: this.getWalletHash(senderPubKey),
                    quantity: quantity,
                    signature: signature,
                    verified: verified
                })
            )
            console.log(`---[ TRANSFER ]---------------------------------------------------------------- \nSender: ${this.getWalletHash(senderPubKey)}\nRecipient: ${recipient}\nQuantity: ${quantity}\nMessage: ${message}\n-------------------------------------------------------------------------------`);
            const embed = new MessageBuilder()
            .setTitle(`Verified transaction!`)
            .addField('Sender', this.getWalletHash(senderPubKey))
            .addField('Recipient', recipient)
            .addField("Message", message)
            .addField("Amount", quantity)
            .setColor('#FF0000')
            .setFooter('CCoin')
            .setTimestamp();
            this.sendToDiscord(discordWebhook,embed)
            resolve(true);
        })
    }
    function getWalletHash(publicKey) {
        return crypto.createHash("sha256").update(publicKey).digest("hex")
    }
    function findAllTransactions() {
        return new Promise(async (resolve) => {
            return resolve(JSON.parse(JSON.stringify(await Transaction.findAll())));
        });
    }
    function getWalletBalance(wallet) {
        return new Promise(async (resolve) => {
            let wallet_balance = 0;
            const transactions = await findAllTransactions();
            for (index in transactions) {
                if (transactions[index].recipient == wallet) {
                    wallet_balance += transactions[index].quantity;
                }
                if (transactions[index].sender == wallet) {
                    wallet_balance -= transactions[index].quantity;
                }
            }
 
            resolve(wallet_balance);
        })
    }

    function getAccountFromUsername(username) {
        return new Promise(async (resolve) => {
            const account = await accounts.findOne({where:{username: username}});
            if (account === null) {
                return resolve(false);
            }
            return resolve(account)
        })
    }

    function generateWallet(password, username, email) {
        return new Promise(async (resolve, reject) => {
            const {
                generateKeyPair
            } = require('crypto');
            generateKeyPair('rsa', {
                modulusLength: 4096,
                publicKeyEncoding: {
                    type: 'spki',
                    format: 'pem'
                },
                // GENERATE WITH PASSWORD
                // privateKeyEncoding: {
                //     type: 'pkcs8',
                //     format: 'pem',
                //     cipher: 'aes-256-cbc',
                //     passphrase: password
                // }
                // GENERATE WITHOUT PASSWORD
                privateKeyEncoding: {
                    type: 'pkcs8',
                    format: 'pem'
                }
            }, async (err, publicKey, privateKey) => {
                const key = {
                    [username]: {
                        "privatekey": privateKey,
                        "publickey": publicKey,
                        "password": password,
                        "email": email
                    }
                }
                await accounts.create({
                    username: username,
                    publickey: publicKey,
                    privatekey: privateKey,
                    password: password,
                    email: email,
                    settings: defaultSettings,
                    cookie: "N/A"
                })
                await accounts
                resolve(key);
            });
        });
    }
    class debug {
        async accountWindow(info, account) {
            var screen = blessed.screen({
                smartCSR: true
            });
            const wallet_amount = await getWalletBalance(crypto.createHash("sha256").update(account.publickey).digest("hex"))
            screen.title = 'CCoin Account';
            screen.key(['escape', 'q', 'C-c'], function (ch, key) {
                return process.exit(0);
            });
            const box = blessed.box({
                label: 'Your Account',
                content: `Username: ${info.username}\nWallet: ${crypto.createHash("sha256").update(account.publickey).digest("hex")}\nAmount: ${wallet_amount}`,
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
            const pad = (n, s = 2) => (`${new Array(s).fill(0)}${n}`).slice(-s);
            const d = new Date();

            return `${pad(d.getFullYear(),4)}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
        }
        constructor(info, nextHash = " ") {
            this.timestamp = new Date();
            this.info = info;
            this.nextHash = nextHash;
            this.hash = this.computeHash();
            this.verified = info.verified;
            this.signature = info.signature;
        }

        computeHash() {
            return SHA256(
                this.nextHash +
                this.timestamp +
                JSON.stringify(this.info)
            ).toString();
        }
    }
    async function validateApiKey(apiName,apiPass,permissions) {
        if (PrivateApis[apiName] == undefined || PrivateApis[apiName] == null) {
            return 0; // error code 0: apiDoesNotExist
        }
        if (PrivateApis[apiName].permissions != permissions) {
            return 1; // error code 1: invalid permissions
        }
        if (PrivateApis[apiName].apiPass == apiPass) {
            return 3; // 3: clear!
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
            return new Promise((resolve) => {
                    newBlock.nextHash = this.obtainLatestBlock().hash;
                    newBlock.hash = newBlock.computeHash();
                    this.block1chain.push(newBlock);
                    Transaction.create({message: newBlock.info.message, timestamp: newBlock.timestamp, sender: newBlock.info.sender, recipient: newBlock.info.recipient, quantity: newBlock.info.quantity, hash: newBlock.hash, signature: newBlock.signature, verified: newBlock.verified})
                    resolve(true);
            })
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

    module.exports = {
        generateWallet,
        BlockCrypto,
        Blockchain,
        getAccountFromUsername,
        debug,
        getWalletBalance,
        findAllTransactions,
        SendCoin,
        getAccountFromEmail,
        addAuthToken,
        getAccountFromAuthToken,
        sendToDiscord,
        addToWallet,
        validateApiKey,
        getWalletHash
    }
})();