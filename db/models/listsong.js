const Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('listsong', {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    order: { type: Sequelize.INTEGER }
  }, {
    freezeTableName: true // Model tableName will be the same as the model name
  });
};
