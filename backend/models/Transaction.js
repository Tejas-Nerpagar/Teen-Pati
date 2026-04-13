import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import User from './User.js';
import Room from './Room.js';

const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Allow null for offline/guests
  },
  guest_name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  room_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  amount: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('entry', 'bet', 'win', 'loss', 'pass', 'fold', 'show'),
    allowNull: false,
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  }
});

export default Transaction;
