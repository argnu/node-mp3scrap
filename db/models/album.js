const Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('album', {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: Sequelize.STRING, field: 'name' },
    year: { type: Sequelize.INTEGER(4), field: 'year' },
    art: { type: Sequelize.BOOLEAN, field: 'art' }
  }, {
    freezeTableName: true // Model tableName will be the same as the model name
  });
};
