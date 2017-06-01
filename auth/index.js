const jwt = require('jwt-simple');
const db = require('../db');
const validation = require('./validation');

function genToken(user) {
  let expires = expiresIn(1); // 1 dia
  let token = jwt.encode({
    user: user,
    exp: expires
  }, require('./config/secret')());

  return token;
}

function expiresIn(numDays) {
  var dateObj = new Date();
  return dateObj.setDate(dateObj.getDate() + numDays);
}

module.exports.validation = validation;

module.exports.authenticate = function(email, password) {
  return new Promise(function(resolve, reject) {
    if (!email || !password) reject(invalid_credentials);
    db.User.findOne({ where: { email: email } })
      .then(user => {
        if (user && user.authenticate(password)) {
          let user_data = {
            id: user.dataValues.id,
            admin: user.dataValues.admin,
          };
          let json = { token: genToken(user_data), data: user.dataValues };
          resolve({ return_type: 'ok', json: json});
        }
        else resolve({ return_type: 'not_authorized' });
      })
      .catch(e => reject(e));
  });
};
