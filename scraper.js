//jshint esnext:true

const db = require('./db');
const utils = require('./utils');
const path = require('path');
const fs = require('fs');
const mm = require('musicmetadata');
const EventEmitter = require('events').EventEmitter;

var evt_emitter = new EventEmitter();

module.exports.scanner_evt = evt_emitter;


function processFile(metadata) {
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

    return processArtist(artist_data)
            .then(artist => processAlbum(artist, album_data))
            .then(albm => processSong(albm, song_data))
            .then(song => processGenre(song, metadata.genre[0]));
}

function processArtist(artist_data) {
    return new Promise(function(resolve, reject) {
      db.Artist.findAll({ where: artist_data })
        .then(art => {
            if (art.length === 0) {
              db.Artist.build(artist_data).save()
                .then(a => {
                  evt_emitter.emit('new-artist', artist_data.name);
                  resolve(a);
                });
            }
            else resolve(art[0]);
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
                evt_emitter.emit('new-album', album_data.name);
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
                evt_emitter.emit('new-song', song_data.name);
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

function processGenre(song, genre_string){
  if (genre_string) {
    let genres = genre_string.split(/[;\/]/);
    let promises = [];
    genres = utils.delDuplicates(genres);
    genres.forEach(genre_name => {
      promises.push(findOrAddGenre(genre_name));
    });
    return Promise.all(promises)
      .then(genres => song.addGenres(genres))
      .catch(err => console.log(err));
  }
}

function findOrAddGenre(genre_name) {
  return new Promise(function(resolve, reject) {
    db.Genre.findAll({ where: {name: genre_name} })
      .then(genre => {
        if (genre.length === 0) {
          db.Genre.build({name:genre_name}).save()
            .then(g => {
              evt_emitter.emit('new-genre', genre_name);
              resolve(g);
            });
        }
        else resolve(genre[0]);
      });
  });
}

function processFiles(gen){
  let val = gen.next().value;
  if (val === null) {
    evt_emitter.emit('end');
    return;
  }
  else {
    mm(fs.createReadStream(val), function (err, metadata) {
      if (err) throw err;
      metadata.file = val;
      processFile(metadata)
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
  utils.getMp3s(path)
    .then(files => {
        let gen = itFiles(files);
        processFiles(gen);
    })
    .catch(error => {
      console.log(error);
    });

  return;
};
