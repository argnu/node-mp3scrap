// jshint esnext:true

// const id3 = require('id3js');
const express = require('express');
const app = express();

const path = require('path');
const fs = require('fs');
const mm = require('musicmetadata');

const db = require('./db.js');
const utils = require('./utils.js');

db.init()
  .then(r => {
  // 
  //   let artist = 'Aca Seca Trio';
  //   let artist_path = path.join('/media/datos/Musica/Discos/', artist);
  //
  //   utils.getMp3s(artist_path)
  //     .then(files => {
  //       files.forEach(file => {
  //         mm(fs.createReadStream(file), function (err, metadata) {
  //           if (err) throw err;
  //
  //           let artist_data = {
  //               name: metadata.artist[0]
  //           };
  //
  //           let album_data = {
  //             name: metadata.album,
  //             year: metadata.year
  //           };
  //
  //           let song_data = {
  //             name: metadata.title,
  //             track: metadata.track.no,
  //             path: file
  //           };
  //
  //           db.Artist.findOrCreate({ where: artist_data })
  //             .then(art => {
  //               db.Album.findOne({
  //                 where: album_data,
  //                 include: [{
  //                     model: Artist
  //                 }]
  //               })
  //                 .then(alb => {
  //                   if (alb.length === 0 ) {
  //                     return db.Album.build(album_data).save()
  //                       .then(new_alb => {
  //                         art.addAlbum(new_alb);
  //                         return Promise.resolve(new_alb);
  //                       })
  //                   }
  //                   else Promise.resolve(alb);
  //                 })
  //                 .then(alb => {
  //                   Song.build(data).save()
  //                     .then(new_song => alb.addSong(new_song));
  //                 });
  //             });
  //       });
  //     })
  //     .catch(error => {
  //       console.log(error);
  //     });
  // });
});


// db.getSongs()
//   .then(songs => {
//     console.log(songs);
//   });


// app.get('/', function(req, res) {
//   res.send('Holaaa!');
// });
//
// app.listen(3000, function() {
//   console.log('Ejecutando servidor en puerto 3000');
// });
