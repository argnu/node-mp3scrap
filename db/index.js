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
var User = sequelize.import(__dirname + "/models/user");
var Folder = sequelize.import(__dirname + "/models/folder");
var Playlist = sequelize.import(__dirname + "/models/playlist");

Artist.hasMany(Album, { onDelete: 'CASCADE' });
Album.belongsTo(Artist);
Album.hasMany(Song, { onDelete: 'CASCADE' });
Song.belongsTo(Album);
Folder.hasMany(Song, { onDelete: 'CASCADE' });
Song.belongsTo(Folder);
Song.belongsTo(Artist);
Artist.hasMany(Song);
Song.belongsToMany(Genre, {through: 'SongGenre'});
Genre.belongsToMany(Song, {through: 'SongGenre'});
Playlist.hasMany(Song);
Playlist.belongsTo(User);
User.hasMany(Playlist);

module.exports.Artist = Artist;
module.exports.Album = Album;
module.exports.Song = Song;
module.exports.Genre = Genre;
module.exports.User = User;
module.exports.Folder = Folder;

module.exports.init = function() {
  return sequelize.sync({ force: true });
};
