
const express = require('express')
const app = express()
const fs = require("fs");
const api = require("./src/modules/api.js");
const crypto = require("crypto");
const accounts = require("./src/db/models/Account.js")
const Transaction = require("./src/db/models/Transactions")
const CC = new api.Blockchain()
const path = require("path");
app.use('/src', express.static('src/web/'))
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname + "/src") + "/index.html")
})
app.listen(3000, () => {
  console.log(`Example app listening at http://localhost:3000`)
})