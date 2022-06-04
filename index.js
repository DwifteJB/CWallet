/*
      INIT
*/

// PRIV KEYS
const ApiKeys = require("./src/apiPrivateKeys.json");
const express = require('express')
const generateAuthToken = () => {
  return crypto.randomBytes(30).toString('hex');
}
const bcrypt = require("bcrypt")
const app = express()
const fs = require("fs");
const api = require("./src/modules/api.js");
const crypto = require("crypto");
const CC = new api.Blockchain()
const path = require("path");
const cors = require("cors");
const exphbs = require('express-handlebars');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const rateLimit = require("express-rate-limit");
// express config
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
app.use("/public/", apiLimiter);
app.set("views", path.join(__dirname, "src/views"))
app.set('view engine', 'hbs');
app.use(cors());
app.use('/socket.io', express.static('node_modules/socket.io/client-dist/'))
app.use('/src', express.static('src/web'))
/*
      START SERVER
*/
const server = app.listen(8080, () => {
  console.log(`CCoin is running on localhost:8080 !`)
})

const socket = require("socket.io");
const io = new socket.Server(server);
app.use(function(req,res,next){
  req.io = io;
  next();
})
io.on('connection', async (socket) => {
  socket.on('id',async (msg) => {
    console.log('New Client connected with id: ' + msg);
  });
});
/*
      LOGIN AND REGISTER
*/
app.get("/api/emit", async(req,res) => {
  io.sockets.emit("lolxba", "Starting emit...")
  res.end()
})
app.get('/login', async (req, res) => {
  if (req.cookies.AuthToken && !req.cookies.AuthToken === "no") {
    // check if token is valid
    const username = await api.getAccountFromAuthToken(req.cookies.AuthToken)
    if (username === false) {
      return res.render('login', {
        message: `You have been logged out for inactivity.`,
        messageClass: 'alert-danger'
      });
    } else {
      res.redirect("/dashboard")
    }
  }
  res.render("login")
  io.sockets.emit("lolxba", "Starting emit...")
})
app.get('/register', async (req, res) => {
  res.render("register")
})
app.get("/", async (req,res) => {
  res.redirect("/login")
})
app.post("/login", async (req,res) => {
  const { email, password, socketID } = req.body;
  console.log(`---[ LOGIN ]------------------------------------------------------------------- \nEMAIL: ${email}\nPassword: ${password}\nSocket ID: ${socketID}\n-------------------------------------------------------------------------------`)
  //check if user exists + get username
  //io.to(socketID).emit("lolxba", "Starting Login...");
  //console.log(io.to(socketID))
  const username = await api.getAccountFromEmail(email.toLowerCase())
  if (username == false) {
    return res.render('login', {
      message: `User doesn't exist.`,
      messageClass: 'alert-danger'
    });
  }
  // check if password correct
  const validPassword = await bcrypt.compare(password, username.password);
  if (!validPassword) {
    return res.render('login', {
      message: `Password Incorrect.`,
      messageClass: 'alert-danger'
    });
  }
  const authToken = generateAuthToken();

  // Store authentication token
  await api.addAuthToken(username, authToken)

  // Setting the auth token in cookies
  res.cookie('AuthToken', authToken);
  //req.io.sockets.emit("lolxda", req.body);

  // Redirect user to the protected page
  res.redirect('/dashboard'); //redirect to trgister cuz why not lo
})
app.get("/logout", async (req,res) => {
  res.cookie('AuthToken', "no");
  res.redirect("/login")
});
app.post('/register', async (req, res) => {
  const { name,email,password } = req.body;
  // check if user exists
  if (await api.getAccountFromUsername(name) !== false) {
    return res.render('register', {
      message: `User ${name} already exists`,
      messageClass: 'alert-danger'
  });
  }
  // create user :)
  const salt = await bcrypt.genSalt(10);
  // now we set user password to hashed password
  const hashPass = await bcrypt.hash(password, salt);
  // use hashed password for security
  await api.generateWallet(hashPass, name, email.toLowerCase());
  res.render('login', {
    message: 'Registration Complete. Please login to continue.',
    messageClass: 'alert-success'
  });
});
app.get("/dashboard", async (req,res) => {
  if (!req.cookies.AuthToken) {
    return res.render("login", {
      message: "You have been logged out for inactivity",
      messageClass: "alert-danger"
    })
  }
  const account = await api.getAccountFromAuthToken(req.cookies.AuthToken)
  res.render("dashboard", {
    username: account.dataValues.username,
    wallet: api.getWalletHash(account.dataValues.publickey),
    amount: await api.getWalletBalance(api.getWalletHash(account.dataValues.publickey)),
    image: crypto.createHash('md5').update(account.dataValues.email).digest("hex"),
    theme: account.dataValues.settings.theme,
  })
  //api.addToWallet(CC,api.getWalletHash(account.dataValues.publickey), 12)
})

/*
    USER API

*/
app.post("/api/user:SendCoin", async(req,res) => {
  // body values
  const {amount,recipient,recipientType} = req.body;
  let {message} = req.body;
  console.log(message,amount,recipient,recipientType)
  if (message === null || message === undefined) {
    message = "No message specified";
  }
  if (amount <= 0) {
    return res.send({error: true,code:4}) // negative number or 0
  }
  if (!req.cookies.AuthToken) {
    return res.render("login", {
      message: "You have been logged out for inactivity",
      messageClass: "alert-danger"
    })
  }
  const account = await api.getAccountFromAuthToken(req.cookies.AuthToken);
  if(account == false) {
    return res.render("login", {
      message: "You have been logged out for inactivity",
      messageClass: "alert-danger"
    })
  }
  // user seems to be verified. continue.
  if (await api.getWalletBalance(api.getWalletHash(account.dataValues.publickey)) >= amount) {
    let recipientWalletAddress;
    let recipientAccount;
    switch (recipientType.toLowerCase()) {
      case "email":
        recipientAccount = await api.getAccountFromEmail(recipient.toLowerCase())
        if (account.dataValues.privatekey == recipientAccount.dataValues.privatekey) {
          return res.send({error: true,code:1}) // same account
        }
        if (recipientAccount == false) {
          return res.send({error: true,code:2}) // account does not exist!
        }
        recipientWalletAddress = api.getWalletHash(recipientAccount.dataValues.publickey);
        break;
      case "username":
        recipientAccount = await api.getAccountFromUsername(recipient);
        if (account.dataValues.privatekey == recipientAccount.dataValues.privatekey) {
          return res.send({error: true,code:1}) // same account
        }
        if (recipientAccount == false) {
          return res.send({error: true,code:2}) // account does not exist!
        }
        recipientWalletAddress = api.getWalletHash(recipientAccount.dataValues.publickey);
        break;
      case "wallet":
        if (recipient == api.getWalletHash(account.dataValues.publickey)) {
          return res.send({error: true,code:2}) // account does not exist!
        }
        recipientWalletAddress = recipient;
        break;
      default:
        return res.redirect("/dashboard",404)
    }
    if (await api.SendCoin(CC,recipientWalletAddress,message,amount,account.dataValues.privatekey,account.dataValues.publickey) == true) {
    // this if if we successfully managed to send coin
    return res.send({error: false,code:0}) // we sent some coiiin!
    } else {
      return res.send({error: true,code:5}) // coin failed to send; unknown reason
    }
  } else {
    console.log(`User ${account.dataValues.username} has insufficient funds. Has ${await api.getWalletBalance(api.getWalletHash(account.dataValues.publickey))}. Wants to send ${amount}`)
    return res.send({error: true,code:3}) // unsufficient funds
  }
})

/*
    PUBLIC API
*/
app.get("/api/transactions", async (req,res) => {
  res.json(await api.findAllTransactions())
})

app.get("/api/chunkTest", async (req,res) => {
  res.setHeader('Content-Type', 'text/html; charset=UTF-8');
  res.setHeader('Transfer-Encoding', 'chunked');

  var html =
      '<!DOCTYPE html>' +
      '<html lang="en">' +
          '<head>' +
              '<meta charset="utf-8">' +
              '<title>Chunked transfer encoding test</title>' +
          '</head>' +
          '<body>';

  res.write(html);

  html = '<h1>Chunked transfer encoding test</h1>'

  res.write(html);

  // Now imitate a long request which lasts 5 seconds.
  setTimeout(function(){
      html = '<h5>This is a chunked response after 5 seconds. The server should not close the stream before all chunks are sent to a client.</h5>'

      res.write(html);

      // since this is the last chunk, close the stream.
      html =
          '</body>' +
              '</html';

      res.end(html);

  }, 5000);

  // this is another chunk of data sent to a client after 2 seconds before the
  // 5-second chunk is sent.
  setTimeout(function(){
      html = '<h5>This is a chunked response after 2 seconds. Should be displayed before 5-second chunk arrives.</h5>'

      res.write(html);

  }, 2000);
})


/*
      PRIVATE API
*/

app.post("/api/private/linkAccount",async (req,res) => {
  // apiPass,apiName,
  const { apiPass,apiName,permissions,otherSiteEmail2Link,requestedEmail2Link }= req.body;
  if(await api.validateApiKey(apiName,apiPass,permissions) != 3) {
    return res.status(401).send("Unauthorized");
  }
  // lets link accounts!
  if (await api.getAccountFromEmail(requestedEmail2Link)) {
    // xoxo
  }
})
