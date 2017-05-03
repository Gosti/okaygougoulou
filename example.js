var express = require('express');
var googlehome = require('./google-home-notifier');
var ngrok = require('ngrok');
var bodyParser = require('body-parser');
var app = express();
const serverPort = 8080;

var http = require("http");
HTTPServer = http.Server(app);

var deviceName = 'Google Home';
googlehome.device(deviceName);

var urlencodedParser = bodyParser.urlencoded({ extended: false });

app.set('view engine', 'ejs');


var fs = require('fs');


global.phonetic = [];
global.sound = [];
global.url = "";

fs.readFile('conf.json', 'utf8', function (err, data) {
  if (err) {
    return console.log(err);
  }
  j = JSON.parse(data);
  global.phonetic = j.phonetic;
  global.sound = j.sound;
});


app.post('/google-home-notifier', urlencodedParser, function (req, res) {
  if (!req.body) return res.sendStatus(400)


  var text = req.body.text;
  var langage = req.body.lang;

  if (!langage) {
    langage = "en"
  }


  if (text == "%") {
    console.log(global.url)
    text = text.replace("%", global.url);
  }

console.log(text[0])

  splited = text.split(" ")

  for (var i = 0; i < splited.length; i++) {
    if (global.phonetic[splited[i]]) {
      splited[i] = global.phonetic[splited[i]]
    }
  }
  text = splited.join(" ")

  if (text) {

    googlehome.newtify({ text: text, langage: langage, url: global.url }, function (res) {
      console.log(res);
    });

    res.render('index', { title: "Sent !" });
  } else {
    res.render('index', { title: "" });
  }

})

app.use(express.static(__dirname + "/public"))


app.get("/phonetic", urlencodedParser, function (req, res) {
  if (!req.body) return res.sendStatus(400)

  res.render('phonetic', { phonetic: global.phonetic, key: Object.keys(global.phonetic) })

  console.log(JSON.stringify(global.phonetic));
});

app.post("/phonetic", urlencodedParser, function (req, res) {
  if (!req.body) return res.sendStatus(400)

  if (req.body.from && req.body.to) {
    global.phonetic[req.body.from] = req.body.to
    console.log(global.phonetic)

    fs.writeFile("conf.json", JSON.stringify({ "phonetic": Object.assign({}, global.phonetic), "sound": Object.assign({}, global.sound) }), function (err) {
      if (err) {
        return console.log(err);
      }


      console.log(JSON.stringify(global.phonetic))
      console.log("The file was saved!");
    });
    res.render('phonetic', { phonetic: global.phonetic, key: Object.keys(global.phonetic) })
  }
});


app.get("/sound", urlencodedParser, function (req, res) {
  if (!req.body) return res.sendStatus(400)

  res.render('sound', { sound: global.sound, key: Object.keys(global.sound) })
});

app.post("/sound", urlencodedParser, function (req, res) {
  if (!req.body) return res.sendStatus(400)

  if (req.body.name && req.body.url) {
    global.sound[req.body.name] = req.body.url
    console.log(global.sound)

    fs.writeFile("conf.json", JSON.stringify({ "phonetic": Object.assign({}, global.phonetic), "sound": Object.assign({}, global.sound) }), function (err) {
      if (err) {
        return console.log(err);
      }


      console.log(JSON.stringify(global.phonetic))
      console.log("The file was saved!");
    });
    res.render('sound', { sound: global.sound, key: Object.keys(global.sound) })
  }
});


app.get('*', function (req, res) {
  res.render('index', { title: "" });
});

app.listen(serverPort, function () {
  ngrok.connect(serverPort, function (err, url) {
    global.url = url
    console.log(url)
    console.log('POST "text=Hello Google Home" to:');
    console.log('    http://localhost:' + serverPort + '/google-home-notifier');
    console.log('    ' + url + '/google-home-notifier');
    console.log('example:');
    console.log('curl -X POST -d "text=Hello Google Home" ' + url + '/google-home-notifier');
  });
})
