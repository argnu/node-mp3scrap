const slugify = require('slugify');
const db = require('./db');
const utils = require('./utils');
const path = require('path');
const fs = require('fs');
const mm = require('musicmetadata');
const request = require('request');
const cheerio = require('cheerio');
var app_events = require('./app-events');

function downloadArtLastFM(artist, album) {
  return new Promise(function(resolve, reject) {
    try {
      console.log(`${album}: Fetching album art...`);
      let url = `https://www.last.fm/music/${artist}/${album}`;
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
              .pipe(fs.createWriteStream(`${__dirname}/files/album-art/${album}.jpg`));
              console.log('Done!');
              resolve(`${__dirname}/files/album-art/${album}.jpg`);
            }
          }
          reject('No hay imagen para dicho album');
        });
      });
    } catch (e) {
      reject(e);
    }
  });
}


function processFile(metadata, folder) {
  let artist_data = {
      name: metadata.artist[0]
  };

  let album_data = {
    name: metadata.album,
    year: metadata.year,
    art:  false
  };

  let song_data = {
    name: metadata.title,
    track: metadata.track.no,
    uri: metadata.file
  };

  return processArtist(artist_data)
          .then(artist => processAlbum(artist, album_data, folder.search_art))
          .then(alb => processSong(alb, song_data, folder))
          .then(song => processGenre(song, metadata.genre[0]));
}

function processArtist(artist_data) {
    return new Promise(function(resolve, reject) {
      db.Artist.findOne({ where: artist_data })
        .then(artist => {
            if (!artist) {
              db.Artist.build(artist_data).save()
                .then(a => {
                  app_events.db.emit('new-artist', a);
                  resolve(a);
                })
                .catch(e => reject(e));
            }
            else resolve(artist);
        })
        .catch(e => reject(e));
    });
}

function addAlbum(artist, data) {
  return new Promise(function(resolve, reject) {
    db.Album.build(data).save()
      .then(a => {
        a.setArtist(artist)
          .then(r => {
            app_events.db.emit('new-album', a);
            resolve(a);
          })
          .catch(e => reject(e));
      })
      .catch(e => reject(e));
  });
}

//agrega el album al artista si no existía y lo devuelve
function processAlbum(artist, album_data, search_art) {
  return new Promise((resolve, reject) => {
    artist.getAlbums({ where: { name: album_data.name }})
          .then(albums => {
            if (albums.length === 0) {
              addAlbum(artist, album_data)
                .then(a => {
                  if (search_art) {
                    downloadArtLastFM(artist.name, album_data.name)
                      .then(art_path => {
                        let data = album_data;
                        a.art = true;
                        a.save().then(() => resolve(a))
                                .catch(e => reject(e));
                      })
                      .catch(e => {
                        resolve(a);
                        console.log('Error descargando album art', e);
                      });
                  }
                  else {
                    resolve(a);
                  }
                });
            }
            else {
              if (search_art && !albums[0].art) {
                downloadArtLastFM(artist.name, album_data.name)
                  .then(art_path => {
                    let data = album_data;
                    albums[0].art = true;
                    albums[0].save().then(() => resolve(albums[0]))
                            .catch(e => reject(e));
                  })
                  .catch(e => {
                    resolve(albums[0]);
                    console.log('Error descargando album art', e);
                  });
              }
              else resolve(albums[0]);
            }
          })
          .catch(e => reject(e));
  });
}

//agrega la canción al albúm si no existía y la devuelve
function processSong(album, song_data, folder) {
  return new Promise((resolve, reject) => {
    album.getSongs({ where: song_data })
          .then(songs => {
            if (songs.length === 0) {
              let stats = fs.statSync(song_data.uri);
              song_data.size = stats.size / 1000000.0;
              db.Song.build(song_data).save()
                .then(s => {
                  album.getArtist()
                       .then(artist => {

                           Promise.all([ artist.addSong(s), album.addSong(s), folder.addSong(s) ])
                                   .then(r => {
                                     app_events.db.emit('new-song', song_data.name);
                                     resolve(s);
                                   })
                                   .catch(e => reject(e));
                       })
                       .catch(e => reject(e));

                })
                .catch(e => reject(e));
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
              // evt_emitter.emit('new-genre', genre_name);
              resolve(g);
            });
        }
        else resolve(genre[0]);
      });
  });
}

function processFiles(gen, folder) {
  return new Promise(function(resolve, reject) {
    let val = gen.next().value;
    if (val === null) resolve();
    else {
      mm(fs.createReadStream(val), function (err, metadata) {
        if (err) throw err;
        metadata.file = val;
        processFile(metadata, folder)
          .then(a => {
            processFiles(gen, folder)
              .then(() =>  resolve())
              .catch(e => reject(e));
          })
          .catch(e => reject(e));
      });
    }
  });
}


function* itFiles(array){
  for (var i = 0; i < array.length; i++) {
    yield array[i];
  }
  yield null;
}

module.exports.scan = function(folder) {
  return utils.getMp3s(folder.path)
    .then(files => {
        let gen = itFiles(files);
        return processFiles(gen, folder);
    })
    .catch(error => {
      console.log(error);
    });
};
