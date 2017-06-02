const Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('folder', {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    path: { type: Sequelize.STRING, field: 'path' },
    search_art: { type: Sequelize.BOOLEAN, field: 'search_art' },
    scanned: { type: Sequelize.BOOLEAN, field: 'scanned' },
    last_scan: { type: Sequelize.DATE, field: 'last_scan' },
    scan_finished: { type: Sequelize.BOOLEAN, field: 'scan_finished' }
  }, {
    freezeTableName: true,
    indexes: [{unique: true, fields: ['path']}],
  });
};
