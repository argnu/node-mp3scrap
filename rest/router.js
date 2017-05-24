//jshint esversion:6

const path = require('path');
const express = require('express');
const body_parser = require('body-parser');
const router = express.Router();
const db = require('../db');
const scraper = require('../scraper');

router.use(body_parser.json());
router.use(function (req, res, next) {
  let params = { where: {}};
  for(let key in req.query) {
    if (key === 'offset') params.offset = req.query.offset;
    else if (key === 'limit') params.limit = req.query.limit;
    else params.where[key] = req.query[key];
  }
  req.sql = params;
  next();
});

router.get('/artists', function(req, res) {
  db.Artist.findAll({
    order: [ ['name', 'ASC'] ],
    include: [{
        model: db.Album,
        as: 'albums'
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
        as: 'albums'
    }]
  })
  .then(art => {
      res.json(art);
  })
  .catch(error => {
    res.send(error);
  });
});

router.get('/albums', function(req, res) {
  req.sql.order = [
    ['artistId', 'ASC'],
    ['name', 'ASC']
  ];
  db.Album.findAll(req.sql)
  .then(albums => { res.json(albums); })
  .catch(error => {
    res.status(500);
    res.json({errorType: 'Parámetros de consulta incorrectos', error});
  });
});

router.get('/songs', function(req, res) {
  req.sql.order = [
    [db.Artist, 'name', 'ASC'],
    [db.Album, 'name', 'ASC'],
    ['track', 'ASC']
  ];
  req.sql.include = [{
    model: db.Album,
    attributes: [ 'name' ],
    as: 'album'
  }, {
    model: db.Artist,
    attributes: [ 'name' ],
    as: 'artist'
  }];
  db.Song.findAll(req.sql)
  .then(songs => { res.json(songs); })
  .catch(error => {
    res.status(500);
    res.json({errorType: 'Parámetros de consulta incorrectos', error});
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

router.put('/folders/:id', function(req, res) {
  db.Folder.findOne({ where: { id: req.params.id }})
    .then(folder => {
      folder.scanned = req.body.scanned;
      folder.search_art = req.body.search_art;
      folder.save()
            .then(() => res.json({msg: 'Folder updated', id: folder.id}));
    })
    .catch(e => res.json({error: e}));
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
  return scraper.scan(f)
           .then(r => {
             f.scanned = true;
             f.last_scan = new Date();
             return f.save();
           });
}

router.post('/folders/scan', function(req, res) {
  db.Folder.findAll()
    .then(folders => {
      folders.forEach(f => {
        scanFolder(f).then(r => res.send('Scanning complete!'))
                     .catch(e => res.send('Scanning error'));
      });
    });
});

router.post('/folders/:id/scan', function(req, res) {
  db.Folder.findOne({ where: { id: req.params.id } })
    .then(f => {
        scanFolder(f).then(r => res.send('Scanning complete!'))
                     .catch(e => res.send('Scanning error'));
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
