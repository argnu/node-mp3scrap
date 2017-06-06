const express = require('express');
const router = express.Router();
const return_types = require('../return_types');
const db = require('../db');


router.get('/songs/:id', function(req, res) {
  db.Song.findOne({ where: { id: req.params.id } })
    .then(song => {
      if (song) res.sendFile(song.uri);
      else return_types.not_found(res);
    })
    .catch(e => {
      return_types.internal_error(res, e);
    });
});

router.get('/album-art/:id', function(req, res) {
  db.Album.findOne({ where: { id: req.params.id } })
    .then(album => {
      if (album && album.art) res.sendFile(`${__dirname}/files/album-art/${album.name}.jpg`);
      else return_types.not_found(res);
    })
    .catch(e => {
      return_types.internal_error(res, e);
    });
});

module.exports = router;
