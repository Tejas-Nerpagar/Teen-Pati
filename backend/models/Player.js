import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import User from './User.js';
import Room from './Room.js';

const Player = sequelize.define('Player', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Allow null for offline/guest players in Pass-Pass mode
  },
  guest_name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  room_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  current_bet: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true, // False if folded
  },
  has_passed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  turn_order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  }
});

Player.belongsTo(User, { foreignKey: 'user_id' });
Player.belongsTo(Room, { foreignKey: 'room_id' });

export default Player;
