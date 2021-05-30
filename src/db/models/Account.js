const {
    DataTypes,
    Model
} = require('sequelize');
const sequelize = require('../database');

class Account extends Model {};

Account.init({
    username: {
        type: DataTypes.STRING,
        allowNull: false
    },
    publickey: {
        type: DataTypes.STRING,
        allowNull: false
    },
    privatekey: {
        type: DataTypes.STRING,
        allowNull: false
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    sequelize
});

module.exports = Account;