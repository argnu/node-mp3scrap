// jshint esversion:6

const Sequelize = require('sequelize');
const bcrypt = require('bcrypt');

var hasSecurePassword = function(user, options, callback) {
	if (user.password != user.password_confirmation) {
		throw new Error("Password confirmation doesn't match Password");
	}
	bcrypt.hash(user.get('password'), 10, function(err, hash) {
		if (err) return callback(err);
		user.set('password_digest', hash);
		return callback(null, options);
	});
};

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('user', {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    first_name: { type: Sequelize.STRING, field: 'first_name' },
    last_name: { type: Sequelize.STRING, field: 'last_name' },
    email: { type: Sequelize.STRING, field: 'email' },
    password_digest: {
  		type: Sequelize.STRING,
  		validate: {
  			notEmpty: true
  		}
  	},
    password: {
  		type: Sequelize.VIRTUAL,
  		allowNull: false,
  		validate: {
  			notEmpty: true,
  			len: [6, Infinity]
  		}
  	},
  	password_confirmation: {
  		type: Sequelize.VIRTUAL
  	}
  }, {
  	freezeTableName: true,
  	indexes: [{unique: true, fields: ['email']}],
    hooks: {
      beforeCreate: function(user, options, callback) {
                    	user.email = user.email.toLowerCase();
                    	if (user.password)
                    		hasSecurePassword(user, options, callback);
                    	else
                    		return callback(null, options);
                    },
      beforeUpdate: function(user, options, callback) {
                  	user.email = user.email.toLowerCase();
                  	if (user.password)
                  		hasSecurePassword(user, options, callback);
                  	else
                  		return callback(null, options);
                  }
    },
  	instanceMethods: {
  		authenticate: function(value) {
  			if (bcrypt.compareSync(value, this.password_digest))
  				return this;
  			else
  				return false;
  		}
  	}
  });
};
