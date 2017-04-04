//jshint esnext:true

const db = require('./db');
const utils = require('./utils');
const path = require('path');
const fs = require('fs');
const mm = require('musicmetadata');
var evt = require('./event').evt;

function processArtist(metadata) {
  return new Promise(function(resolve, reject) {
    let artist_data = {
        name: metadata.artist[0]
    };

    let album_data = {
      name: metadata.album,
      year: metadata.year
    };

    let song_data = {
      name: metadata.title,
      track: metadata.track.no,
      uri: metadata.file
    };

    db.Artist.findOrCreate({ where: artist_data })
      .then(art => {
        let artist = art[0];
        processAlbum(artist, album_data)
          .then(a => {
            processSong(a, song_data)
              .then(s => {
                resolve(s);
              });
          });
      });

  });
}

//agrega el album al artista si no existía y lo devuelve
function processAlbum(artist, album_data) {
  return new Promise((resolve, reject) => {
    artist.getAlbums({
      where: album_data
    }).then(albs => {
      if (albs.length === 0) {
        db.Album.build(album_data).save()
          .then(a => {
            artist.addAlbum(a)
              .then(r => {
                evt.emit('new-album', album_data.name);
                resolve(a);
              });
          });
      }
      else {
        resolve(albs[0]);
      }
    });
  });
}

//agrega la canción al albúm si no existía y la devuelve
function processSong(album, song_data) {
  return new Promise((resolve, reject) => {
    album.getSongs({
      where: song_data
    }).then(songs => {
      if (songs.length === 0) {
        let stats = fs.statSync(song_data.uri);
        song_data.size = stats.size / 1000000.0;
        db.Song.build(song_data).save()
          .then(s => {
            album.addSong(s)
              .then(r => {
                evt.emit('new-song', song_data.name);                
                resolve(s);
              });
          });
      }
      else {
        resolve(songs[0]);
      }
    });
  });
}

function processFiles(gen){
  let val = gen.next().value;
  if (val === null) return;
  else {
    mm(fs.createReadStream(val), function (err, metadata) {
      if (err) throw err;
      metadata.file = val;
      processArtist(metadata)
        .then(a => {
          processFiles(gen);
        });

    });
  }
}

function* itFiles(array){
  for (var i = 0; i < array.length; i++) {
    // console.log('Procesando archivo', array[i], '...');
    yield array[i];
  }
  yield null;
}

module.exports.scan = function(path) {
  return utils.getMp3s(path)
    .then(files => {
        let gen = itFiles(files);
        processFiles(gen);
  })
  .catch(error => {
    console.log(error);
  });
};
