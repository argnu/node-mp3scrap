//jshint esversion:6

const Sequelize = require('sequelize');

var sequelize = new Sequelize('database', 'username', 'password', {
  host: 'localhost',
  dialect: 'sqlite',
  pool: {
    max: 5,
    min: 0,
    idle: 10000
  },
  storage: 'database.sqlite',
  logging: false
});

var Artist = sequelize.import(__dirname + "/models/artist");
var Album = sequelize.import(__dirname + "/models/album");
var Song = sequelize.import(__dirname + "/models/song");
var Genre = sequelize.import(__dirname + "/models/genre");

Artist.hasMany(Album);
Album.belongsTo(Artist);
Album.hasMany(Song);
Song.belongsTo(Album);
Song.hasMany(Genre);

module.exports.Artist = Artist;
module.exports.Album = Album;
module.exports.Song = Song;
module.exports.Genre = Genre;

module.exports.init = function() {
  return sequelize.sync({ force: true });
};
