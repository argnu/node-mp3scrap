//jshint esversion:6

const path = require('path');
const express = require('express');
const body_parser = require('body-parser');
const router = express.Router();
const db = require('../db');
const scraper = require('../scraper');
const scanner_evt = scraper.scanner_evt;

router.use(body_parser.json());

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

router.get('/folders', function(req, res) {
  db.Folder.findAll()
    .then(folders => res.json(folders))
    .catch(e => res.json({error: e}));
});

router.post('/folders', function(req, res) {
  let folder_data = {
    path: req.body.path,
    scanned: false,
    search_art: req.body.search_art
  };

  db.Folder.build(folder_data).save()
    .then(a => {
      res.json({msg: 'Folder added', id: a.id });
    });
});

function checkAndDestroyArtist() {
  return db.Artist.findAll()
    .then(artist => {
       artist.forEach(artist => {
         artist.getSongs().then(s => {
           if (Array.isArray(s) && !s.length) artist.destroy();
         });
       });
  });
}

router.delete('/folders/:id', function(req, res) {
  db.Folder.findOne()
    .then(f => {
      f.destroy()
        .then(r => {
          res.json({ msg: 'Folder deleted' });
          checkAndDestroyArtist();
        })
        .catch(e => res.json({error: e}));
    })
    .catch(e => res.json({error: e}));
});

function scanFolder(f) {
  scanner_evt.on('new-song', function (song) {
    console.log('Added song', song);
  });

  scanner_evt.on('new-album', function (album) {
    console.log('Added album', album);
  });

  scanner_evt.on('new-artist', function (artist) {
    console.log('Added artist', artist);
  });

  return new Promise(function(resolve, reject) {
    scraper.scan(f);

    scanner_evt.on('end', () =>{
      console.log('Scanning complete!');
      f.scanned = true;
      f.last_scan = new Date();
      f.save()
        .then(r => resolve(r))
        .catch(e => reject(e));
    });

    scanner_evt.on('error', (e) => {
      reject(e);
    });
  });
}

router.post('/folders/scan', function(req, res) {
  db.Folder.findAll()
    .then(folders => {
      folders.forEach(f => {
        scanFolder(f).then(r => res.send('Scanning complete!'));
      });
    });
});

router.post('/folders/:id/scan', function(req, res) {
  db.Folder.findOne({ where: { id: req.params.id } })
    .then(f => {
        scanFolder(f).then(r => res.send('Scanning complete!'));
    });
});

router.post('/users/authenticate', function(req, res) {
  db.User.findOne({ where: { email: req.body.email } })
    .then(user => {
      if (user && user.authenticate(req.body.pass)) {
        res.json({ valid: true, data: user.dataValues});
      }
      else {
        res.json({ valid: false });
      }
    });
});

module.exports = router;
