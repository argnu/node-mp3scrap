//jshint esnext:true

const slugify = require('slugify');
const db = require('./db');
const utils = require('./utils');
const path = require('path');
const fs = require('fs');
const mm = require('musicmetadata');
const EventEmitter = require('events').EventEmitter;
const request = require('request');
const cheerio = require('cheerio');

var evt_emitter = new EventEmitter();

module.exports.scanner_evt = evt_emitter;

function downloadPicLastFM(artist, album) {
  return new Promise(function(resolve, reject) {
    let url = `https://www.last.fm/music/${artist.name}/${album.name}`;
    request(url, function(error, response, html) {
      if (error) reject(error);
      let $ = cheerio.load(html);
      let a_imagen = $('li.secondary-nav-item--images a');
      let link_imagen = `https://www.last.fm${a_imagen.attr('href')}`;

      request(link_imagen, function(error, response, html) {
        if (error) reject(error);
        if (html) {
          let $ = cheerio.load(html);
          let url_imagen = $('a.gallery-image img').attr('src');
          if (url_imagen) {
            request(url_imagen)
            .on('error', function(err) {
              reject(error);
            })
            .pipe(fs.createWriteStream(`${__dirname}/files/album-pic/${album.name}.jpg`));
            resolve(`${__dirname}/files/album-pic/${album.name}.jpg`);
          }
        }
        reject('No hay imagen para dicho album');
      });
    });
  });
}


function processPic(album, pic_data) {
  return new Promise(function(resolve, reject) {
    if (pic_data) {
      fs.writeFile(`${__dirname}/files/album-pic/${pic_data.name}.${pic_data.format}`, pic_data.data, function(err) {
          if(err) reject(err);
          album.pic = `/files/album-pic/${pic_data.name}.${pic_data.format}`;
          album.save()
            .then(a => resolve(a))
            .catch(err => reject(err));
      });
    }
    else resolve(album);
  });
}

function processFile(metadata) {
  let pic_data;

  if (metadata.picture[0]) {
    pic_data = metadata.picture[0];
    pic_data.name = slugify(`${metadata.artist[0]}-${metadata.album}`);
  }

  let artist_data = {
      name: metadata.artist[0]
  };

  let album_data = {
    name: metadata.album,
    year: metadata.year,
    pic:  pic_data ? pic_data.name : ''
  };

  let song_data = {
    name: metadata.title,
    track: metadata.track.no,
    uri: metadata.file
  };

  return processArtist(artist_data)
          .then(artist => processAlbum(artist, album_data))
          // .then(album => processPic(album, pic_data))
          .then(alb => processSong(alb, song_data))
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

function addAlbum(artist, data) {
  return new Promise(function(resolve, reject) {
    db.Album.build(data).save()
      .then(a => {
        artist.addAlbum(a)
          .then(r => {
            evt_emitter.emit('new-album', data.name);
            resolve(a);
          })
          .catch(e => reject(e));
      })
      .catch(e => reject(e));
  });
}

//agrega el album al artista si no existía y lo devuelve
function processAlbum(artist, album_data) {
  return new Promise((resolve, reject) => {
    artist.getAlbums({
      where: {
        name: album_data.name
      }
    }).then(albs => {
      if (albs.length === 0) {
        // data.pic = `/files/album-pic/${pic_data.name}.${pic_data.format}`;
        downloadPicLastFM(artist, album_data)
          .then(r => {
            let data = album_data;
            data.pic = r;
            return addAlbum(artist, data);
          })
          .catch(e => {
            console.log('Error descargando pic del album', e);
            return addAlbum(artist, album_data);
          })
          .then(a => {
            evt_emitter.emit('new-album', album_data.name);
            resolve(a);
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
