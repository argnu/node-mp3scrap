// jshint esversion:6

const fs = require('fs');
const path = require('path');
const app = require('express')();
const bunyan = require('bunyan');
const config = require('./config');
const rest_router = require('./rest/router');
const file_router = require('./files/router');
const app_events = require('./custom-events/app-events');
const db = require('./db');

if(config.protocol == 'https') {
  const https = require('https');
  var server = https.createServer({
    key: fs.readFileSync(`${config.certFolder}/key.pem`),
    cert: fs.readFileSync(`${config.certFolder}/cert.pem`)
  }, app).listen(config.port, config.host);
}
else {
  var server = require('http').Server(app);
  server.listen(config.port, config.host);
}

const io = require('socket.io')(server);

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, HEAD");
  next();
});

app.use('/rest', rest_router);
app.use('/files', file_router);


io.on('connection', function (socket) {
  if (app_events.db) {
    app_events.db.on('scan-finished', function (folder) {
      socket.emit('scan-finished', folder);
    });
    app_events.db.on('scan-error', function (folder) {
      socket.emit('scan-error', folder);
    });
    app_events.db.on('new-album', function (album) {
      socket.emit('new-album', album);
    });

    app_events.db.on('new-artist', function (artist) {
      socket.emit('new-artist', artist);
    });
  }
});
