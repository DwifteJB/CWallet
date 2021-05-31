const express = require('express')
const generateAuthToken = () => {
  return crypto.randomBytes(30).toString('hex');
}
const app = express()
const fs = require("fs");
const api = require("./api.js");
const crypto = require("crypto");
const CC = new api.Blockchain()
const path = require("path");
const cors = require("cors");
const exphbs = require('express-handlebars');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const rateLimit = require("express-rate-limit");

class config {
    constructor(app) {
        app.use(bodyParser.urlencoded({ extended: true }));
        app.use(cookieParser());
        app.engine('hbs', exphbs({
            extname: '.hbs'
        }));
        // Enable if you're behind a reverse proxy (Heroku, Bluemix, AWS ELB, Nginx, etc)
        // see https://expressjs.com/en/guide/behind-proxies.html
        // app.set('trust proxy', 1);
        const apiLimiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100
        });
        // only apply to requests that begin with /public/
        app.use("/public/", apiLimiter); // public api obv
        app.set("views", path.join(__dirname, "../views"))
        app.set('view engine', 'hbs');
        app.use(cors());
        app.use('/socket.io', express.static(path.join(__dirname, 'node_modules/socket.io/client-dist/')))
        app.use('/src', express.static(path.join(__dirname, 'src/web')))
    }
}
module.exports = {config};