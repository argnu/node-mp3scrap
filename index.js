// jshint esversion:6

const fs = require('fs');
const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const rest_router = require('./rest/router');
const scanner_evt = require('./scraper').scanner_evt;

const db = require('./db/db');


app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use('/rest', rest_router);

app.get('/files/songs/:id', function(req, res) {
  db.Song.findOne({
      where: {
        id: req.params.id
      }
    })
    .then(song => {
      res.sendFile(song.uri);
    });
});

server.listen(3000, function() {
  console.log('Ejecutando servidor en puerto 3000');
});

io.on('connection', function (socket) {
  if (scanner_evt) {
    scanner_evt.on('new-song', function (song) {
      socket.emit('new-song', {name: song});
    });
    scanner_evt.on('new-album', function (album) {
      socket.emit('new-album', {name: album});
    });
    scanner_evt.on('new-artist', function (artist) {
      socket.emit('new-artist', {name: artist});
    });
    scanner_evt.on('new-genre', function (genre) {
      socket.emit('new-genre', {name: genre});
    });
  }
});
