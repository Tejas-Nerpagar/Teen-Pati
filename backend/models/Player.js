import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

// Note: belongsTo associations are declared centrally in models/index.js
// to avoid duplicate foreign key definitions.

const Player = sequelize.define('Player', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // NULL for offline/guest players in Pass-Pass mode
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
    defaultValue: true, // false if folded
  },
  has_passed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  turn_order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
});

export default Player;
