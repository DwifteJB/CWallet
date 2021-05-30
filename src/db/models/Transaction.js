const {
    DataTypes,
    Model
} = require('sequelize');
const sequelize = require('../database');

class Transaction extends Model {};

Transaction.init({
    index: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    timestamp: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    info: {
        sender: {
            type: DataTypes.STRING,
            allowNull: false
        },
        recipient: {
            type: DataTypes.STRING,
            allowNull: false
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    },
    hash: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    sequelize
});

module.exports = Transaction;