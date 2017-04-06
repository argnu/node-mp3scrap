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

module.exports.delDuplicates = function(array) {
  return Array.from(new Set(array));
};

module.exports.clone = function(obj) {
  return JSON.parse(JSON.stringify(obj));
};
