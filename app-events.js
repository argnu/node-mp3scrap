const EventEmitter = require('events').EventEmitter;
let db_emitter = new EventEmitter();

module.exports.db = db_emitter;
