// jshint esversion:6

const fs = require('fs');
const path = require('path');
const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const rest_router = require('./rest/router');
var app_events = require('./app-events');

const db = require('./db');


app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, HEAD");
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

app.get('/files/album-art/:id', function(req, res) {
  db.Album.findOne({
      where: {
        id: req.params.id
      }
    })
    .then(album => {
      if (album && album.art) res.sendFile(`${__dirname}/files/album-art/${album.name}.jpg`);
      else {
        res.status(404);
        res.send({ error: 'Not found' });
      }
    });
});

app.get('/probando', function(req, res) {
  app_events.db.emit('mostrar');
  res.end();
});

server.listen(3000, 'localhost', function() {
  console.log('Ejecutando servidor en puerto 3000');
});


io.on('connection', function (socket) {

  if (app_events.db) {
    // app_events.db.on('new-song', function (song) {
    //   socket.emit('new-song', {name: song});
    // });
    app_events.db.on('new-album', function (album) {
      socket.emit('new-album', album);
    });
    app_events.db.on('new-artist', function (artist) {
      socket.emit('new-artist', artist);
    });
    // app_events.db.on('new-genre', function (genre) {
    //   socket.emit('new-genre', {name: genre});
    // });
  }
});
