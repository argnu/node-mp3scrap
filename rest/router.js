//jshint esversion:6

const path = require('path');
const express = require('express');
const body_parser = require('body-parser');
const router = express.Router();
const db = require('../db');
const scraper = require('../scraper');
const scanner_evt = scraper.scanner_evt;

router.use(body_parser.json());

router.post('/scan', function(req, res) {
  let scan_path = req.body.path;
  scraper.scan(scan_path);

  scanner_evt.on('end', () =>{
    console.log('Scanning complete!');
    res.send('Scanning complete!');
  });

  scanner_evt.on('new-song', function (song) {
    console.log('Added song', song);
  });

  scanner_evt.on('new-album', function (album) {
    console.log('Added album', album);
  });

  scanner_evt.on('new-artist', function (artist) {
    console.log('Added artist', artist);
  });
});

router.get('/artists', function(req, res) {
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

router.get('/artists/:id', function(req, res) {
  db.Artist.findOne({
    where: { id: req.params.id },
    include: [{
        model: db.Album,
        as: 'albums',
        include: [{
          model: db.Song,
          as: 'songs'
        }]
    }]
  })
  .then(art => {
      res.json(art);
  })
  .catch(error => {
    res.send(error);
  });
});

router.post('/users', function(req, res) {

});

router.post('/users/authenticate', function(req, res) {
  db.User.findOne({ where: { email: req.body.email } })
    .then(user => {
      if (user.authenticate(req.body.password)) {
        res.json({ valid: true, data: user.dataValues});
      }
      else {
        res.json({ valid: false });
      }
    });
});

module.exports = router;
