const path = require('path');
const spawn = require('child_process').spawn;
var app_events = require('../app-events');

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
          // console.log(e);
        }
      });

      scraper_proc.stderr.on('data', (data) => {
        console.error('Error scanning folder', folder_path);
      });

      scraper_proc.on('close', (code) => {
        app_events.db.emit('scan_finished', folder);
      });

    } catch (e) {
      console.error('Error scanning folder', folder_path);
    }
};
