const express = require('express')
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
const generateAuthToken = () => {
  return crypto.randomBytes(30).toString('hex');
}
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
app.use('/src', express.static('src/web'))
app.post("/removeAuth", async (req,res) => {
  res.cookie('AuthToken', null);
  res.json({status: "Done",message:"Cleared Auth Token"})
});
// LOGIN / REGISTER SHIT
app.get('/login', async (req, res) => {
  if (req.cookies["AuthToken"]) {
    console.log("COOKIE FOUND: " + req.cookies["AuthToken"])
  }
  res.render("login")
})
app.get('/register', async (req, res) => {
  res.render("register")
})
app.get("/", async (req,res) => {
  res.render('login', {
    message: `page coming soon :)`,
    messageClass: 'alert-success'
  }); 
})
app.post("/login", async (req,res) => {
  const { email, password } = req.body;
  //check if user exists + get username
  const username = await api.getAccountFromEmail(email)
  if (username == false) {
    return res.render('login', {
      message: `User doesn't exist.`,
      messageClass: 'alert-danger'
    }); 
  }
  const authToken = generateAuthToken();

  // Store authentication token
  await api.addAuthToken(username, authToken)

  // Setting the auth token in cookies
  res.cookie('AuthToken', authToken);

  // Redirect user to the protected page
  res.redirect('/register'); //redirect to trgister cuz why not lo
})
app.post('/register', async (req, res) => {
  const { name,email,password } = req.body;
  // check if user exists
  if (await api.getWallet(name) !== false) { 
    return res.render('register', {
      message: `User ${name} already exists`,
      messageClass: 'alert-danger'
  });
  }
  // create user :)
  await api.generateWallet(password, name, email);
  res.render('login', {
    message: 'Registration Complete. Please login to continue.',
    messageClass: 'alert-success'
  });
});


// Public API START
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



// start server
app.listen(8080, () => {
  console.log(`Example app listening at http://localhost:8080`)
})