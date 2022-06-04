const {
    DataTypes,
    Model
} = require('sequelize');
const sequelize = require('../database');

class Account extends Model {};

Account.init({
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
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
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false
    },
    settings: {
        type: DataTypes.JSON,
        allowNull: false
    },
    cookie: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    sequelize
});

module.exports = Account;