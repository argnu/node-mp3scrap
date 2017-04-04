// jshint esversion:6

// const id3 = require('id3js');
const path = require('path');
const fs = require('fs');
const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const db = require('./db');
const scraper = require('./scraper');
var evt = require('./event').evt;


let scan_path = path.join('/home/mweingart/Música/Arbolito');

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/artists', function(req, res) {
  db.Artist.findAll({
    include: [{
        model: db.Album,
        as: 'albums',
        include: [{
          model: db.Song,
          as: 'songs'
        }]
    }]
  })
  .then(arts => {
      res.json(arts);
  })
  .catch(error => {
    res.send(error);
  });
});



app.get('/scan', function(req, res) {
  scraper.scan(scan_path)
    .then(r => {
        res.send('lesto!');
    })
    .catch(error => {
      res.send(error);
    });
});

server.listen(3000, function() {
  console.log('Ejecutando servidor en puerto 3000');
});

io.on('connection', function (socket) {
  evt.on('new-song', function (song) {
    socket.emit('new-song', {name: song});
  });
  evt.on('new-album', function (album) {
    socket.emit('new-album', {name: album});
  });
});
