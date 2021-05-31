const {
    Sequelize
} = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, 'database.sqlite'),
    logging: false,
    omitNull: true
});

(async () => {
    try {
        await sequelize.authenticate();
        await sequelize.sync();
    } catch (error) {
        console.error('Unable to connect to db: ', error);
    }
})();

module.exports = sequelize;