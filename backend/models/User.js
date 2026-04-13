import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  username: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  balance: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 100000, // Start with ₹1,00,000
  },
});

export default User;
