const Sequelize = require('sequelize');
const db = require("../db");

const Order = db.define('OrderProduct', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    orderId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
            model: 'Orders',
            key: 'id'
        }
    },
    productId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
            model: 'Products',
            key: 'id'
        }
    },
    extras: {
        type: Sequelize.STRING(500),
        allowNull: true
    },
    quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
            min: 1
        }
    },
    total: {
        type: Sequelize.FLOAT,
        allowNull: false,
        validate: {
            min: 0.01
        }
    },
    createdAt: Sequelize.DATE,
    updatedAt: Sequelize.DATE
})

module.exports = Order;