//jshint esnext:true

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

var Genre = sequelize.define('genre', {
  id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: Sequelize.STRING, field: 'name' }
});

var Artist = sequelize.define('artist', {
  id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: Sequelize.STRING, field: 'name' }
}, {
  freezeTableName: true // Model tableName will be the same as the model name
});

var Album = sequelize.define('album', {
  id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: Sequelize.STRING, field: 'name' },
  year: { type: Sequelize.INTEGER(4), field: 'year' }
}, {
  freezeTableName: true // Model tableName will be the same as the model name
});

Artist.hasMany(Genre);
Artist.hasMany(Album);
Album.belongsTo(Artist);

var Song = sequelize.define('song', {
  id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: Sequelize.STRING, field: 'name' },
  track: { type: Sequelize.INTEGER(2), field: 'track' },
  uri: { type: Sequelize.STRING, field: 'uri' },
  size: { type: Sequelize.FLOAT, field: 'size' }
}, {
  freezeTableName: true // Model tableName will be the same as the model name
});

Album.hasMany(Song);
Song.belongsTo(Album);


module.exports.init = function() {
  return sequelize.sync({ force: true});
};

module.exports.Artist = Artist;
module.exports.Album = Album;
module.exports.Song = Song;

module.exports.getArtist = function(query) {
  return Artist.findAll({
    where: query
  });
};

module.exports.addArtist = function(data) {
  return Artist.build(data).save();
};

module.exports.getAlbum = function(query) {
  return Album.findAll({
    where: query
  });
};

module.exports.addAlbum = function(data) {
  return Album.build(data).save();
};

module.exports.addSong = function(data) {
  return Song.build(data).save();
};

module.exports.getSongs = function() {
  return Song.findAll({});
};
