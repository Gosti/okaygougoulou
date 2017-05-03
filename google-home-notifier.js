var Client = require('castv2-client').Client;
var DefaultMediaReceiver = require('castv2-client').DefaultMediaReceiver;
var mdns = require('mdns');
var googletts = require('google-tts-api');
var browser = mdns.createBrowser(mdns.tcp('googlecast'));
var deviceAddress;
var device = function (name) {
  device = name;
  return this;
}


//shenanigans
var newtify = function (message, callback) {
  if (!deviceAddress) {
    browser.start();
    browser.on('serviceUp', function (service) {
      console.log('Device "%s" at %s:%d', service.name, service.addresses[0], service.port);
      if (service.name.includes(device.replace(' ', '-'))) {
        deviceAddress = service.addresses[0];

        if (message.text.slice(0, 4) == "http") {
          console.log("ok")
          onDeviceUp(deviceAddress, message.text, function (res) { callback(res) });
        } else {
          getSpeechUrl(message, deviceAddress, function (res) {
            callback(res);
          });
        }
      }
      browser.stop();
    });
  } else {
    if (message.text.slice(0, 4) == "http") {
      onDeviceUp(deviceAddress, message.text, function (res) { callback(res) });
    } else {
      getSpeechUrl(message, deviceAddress, function (res) {
        callback(res);
      });
    }
  }
}

var notify = function (message, callback) {
  if (!deviceAddress) {
    browser.start();
    browser.on('serviceUp', function (service) {
      console.log('Device "%s" at %s:%d', service.name, service.addresses[0], service.port);
      if (service.name.includes(device.replace(' ', '-'))) {
        deviceAddress = service.addresses[0];
        getSpeechUrl(message, deviceAddress, function (res) {
          callback(res);
        });
      }
      browser.stop();
    });
  } else {
    getSpeechUrl(message, deviceAddress, function (res) {
      callback(res);
    });
  }
}

var getSpeechUrl = function (text, host, callback) {
  console.log(text.lan)
  googletts(text.text, text.langage, 1).then(function (url) {
    onDeviceUp(host, url, function (res) {
      callback(res)
    });
  }).catch(function (err) {
    console.error(err.stack);
  });
}

var onDeviceUp = function (host, url, callback) {
  var client = new Client();
  client.connect(host, function () {
    client.launch(DefaultMediaReceiver, function (err, player) {
      console.log(url)
      var media = {
        contentId: url,
        contentType: 'audio/mp3',
        streamType: 'BUFFERED', // or LIVE
      };
      player.load(media, { autoplay: true }, function (err, status) {
        client.close();
        callback('Device notified');
      });
    });
  });

  client.on('error', function (err) {
    console.log('Error: %s', err.message);
    client.close();
    callback('error');
  });
}

exports.device = device;
exports.notify = notify;
exports.newtify = newtify;
