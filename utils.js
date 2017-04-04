//jshint esversion:6

const fs = require('fs');
const path = require('path');

function walk(dir) {
  return new Promise((resolve, reject) => {
    let results = [];
    fs.readdir(dir, function(err, list) {
      if (err) return reject(err);
      let pending = list.length;
      if (!pending) return resolve(results);
      list.forEach(function(file) {
        file = path.resolve(dir, file);
        fs.stat(file, function(err, stat) {
          if (stat && stat.isDirectory()) {
            walk(file).
              then(res => {
                results = results.concat(res);
                if (!--pending) resolve(results);
              })
              .catch(err => {
                reject(err);
              });
          } else {
            if (file.endsWith('.mp3')) results.push(file);
            if (!--pending) resolve(results);
          }
        });
      });
    });
  });
}

module.exports.getMp3s = walk;

/*
 * serial executes Promises sequentially.
 * @param {funcs} An array of funcs that return promises.
 * @example
 * const urls = ['/url1', '/url2', '/url3']
 * serial(urls.map(url => () => $.ajax(url)))
 *     .then(console.log.bind(console))
 */
module.exports.serial = funcs =>
    funcs.reduce((promise, func) =>
        promise.then(result => func().then(Array.prototype.concat.bind(result))), Promise.resolve([]));
