const {
    DataTypes,
    Model
} = require('sequelize');
const sequelize = require('../database');

class Transactions extends Model {};

Transactions.init({
    message: {
        type: DataTypes.TEXT,
        defaultValue: ' '
    },
    timestamp: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
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
    },
    hash: {
        type: DataTypes.STRING,
        allowNull: false
    },
    verified: {
        type: DataTypes.BOOLEAN,
        allowNull: false
    },
    signature: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    sequelize
});

module.exports = Transactions;