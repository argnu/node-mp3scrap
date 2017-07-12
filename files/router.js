const path = require('path');
const express = require('express');
const router = express.Router();
const return_types = require('../return_types');
const db = require('../db');
const bunyan = require('bunyan');
const log = bunyan.createLogger({
    name: 'rest',
    streams: [{
        path: path.resolve(__dirname, '..', 'logs/errors.log'),
    }]
});

router.get('/songs/:id', function(req, res) {
  db.Song.findOne({ where: { id: req.params.id } })
    .then(song => {
      if (song) res.sendFile(song.uri);
      else return_types.not_found(res);
    })
    .catch(error => {
      log.info(error);
      return_types.internal_error(res);
    });
});

router.get('/songs/:id/download', function(req, res) {
  db.Song.findOne({ where: { id: req.params.id } })
    .then(song => {
      if (song) {
        let headers = {
          'Content-disposition': `attachment; filename="${song.name}.mp3"`,
          'Content-type': 'audio/mpeg'
        };
        res.sendFile(song.uri, {headers: headers});
      }
      else return_types.not_found(res);
    })
    .catch(error => {
      log.info(error);
      return_types.internal_error(res);
    });
});

router.get('/album-art/:id', function(req, res) {
  db.Album.findOne({ where: { id: req.params.id } })
    .then(album => {
      if (album && album.art) res.sendFile(`${__dirname}/album-art/${album.name}.jpg`);
      else return_types.not_found(res);
    })
    .catch(error => {
      log.info(error);
      return_types.internal_error(res);
    });
});

module.exports = router;
