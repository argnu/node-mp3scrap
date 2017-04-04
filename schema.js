var Genre = sequelize.define('genre', {
  id: { type: Sequelize.INTEGER, autoIncrement: true },
  name: { type: Sequelize.STRING, field: 'name' }
});

var Artist = sequelize.define('artist', {
  id: { type: Sequelize.INTEGER, autoIncrement: true },
  name: { type: Sequelize.STRING, field: 'name' }
}, {
  freezeTableName: true // Model tableName will be the same as the model name
});

var Album = sequelize.define('artist', {
  id: { type: Sequelize.INTEGER, autoIncrement: true },
  name: { type: Sequelize.STRING, field: 'name' },
  year: { type: Sequelize.INTEGER(4), field: 'year' }
}, {
  freezeTableName: true // Model tableName will be the same as the model name
});

Artist.hasMany(Album);
Album.belongsTo(Artist);

var Song = sequelize.define('song', {
  id: { type: Sequelize.INTEGER, autoIncrement: true },
  name: { type: Sequelize.STRING, field: 'name' },
  track: { type: Sequelize.INTEGER(2), field: 'track' }
}, {
  freezeTableName: true // Model tableName will be the same as the model name
});

Album.hasMany(Song);
Song.belongsTo(Album);
