import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Room = sequelize.define('Room', {
  id: {
    type: DataTypes.STRING, // e.g., A short code like "ROOM123"
    primaryKey: true,
  },
  status: {
    type: DataTypes.ENUM('waiting', 'playing', 'finished'),
    defaultValue: 'waiting',
  },
  entry_amount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 100,
  },
  host_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  current_turn_index: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  current_highest_bet: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  pot_amount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  }
});

export default Room;
