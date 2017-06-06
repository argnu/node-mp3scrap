const path = require('path');
const spawn = require('child_process').spawn;
const bunyan = require('bunyan');
const log = bunyan.createLogger({
    name: 'rest',
    streams: [{
        path: path.resolve(__dirname, '..', 'logs/errors.log'),
    }]
});
var app_events = require('../custom-events/app-events');

module.exports.scan = function(folder) {
    try {
      let scraper_proc = spawn('python',
        [ path.resolve(__dirname, 'python/scraper.py'),
          path.resolve(__dirname, '..', 'database.sqlite'),
          folder.path, folder.search_art ? 'True': 'False'
        ], { stdio: ['ignore', 'pipe', 'pipe'] });

      scraper_proc.stdout.on('data', (data) => {
        try {
          let message = JSON.parse(data.toString());
          app_events.db.emit(message.type, message.elem);
        } catch (e) {
          log.info(e);
        }
      });

      scraper_proc.stderr.on('data', (data) => {
        log.info(data.toString());
      });

      scraper_proc.on('close', (code) => {
        app_events.db.emit('scan-finished', folder.path);
      });

    } catch (e) {
      log.info(e);
      app_events.db.emit('scan-error', folder.path);
    }
};
