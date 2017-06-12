// jshint esversion:6

const fs = require('fs');
const path = require('path');
const app = require('express')();
const bunyan = require('bunyan');
// const https = require('https');
const server = require('http').Server(app);
server.listen(3000);


const rest_router = require('./rest/router');
const file_router = require('./files/router');
var app_events = require('./custom-events/app-events');

const db = require('./db');

// let server = https.createServer({
//   key: fs.readFileSync(`${process.argv[3]}/key.pem`),
//   cert: fs.readFileSync(`${process.argv[3]}/cert.pem`)
// }, app).listen(3000);

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
