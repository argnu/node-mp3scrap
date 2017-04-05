// jshint esversion:6

const Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('song', {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: Sequelize.STRING, field: 'name' },
    track: { type: Sequelize.INTEGER(2), field: 'track' },
    uri: { type: Sequelize.STRING, field: 'uri' },
    size: { type: Sequelize.FLOAT, field: 'size' }
  }, {
    freezeTableName: true // Model tableName will be the same as the model name
  });
};