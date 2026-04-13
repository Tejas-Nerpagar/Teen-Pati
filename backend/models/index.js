import sequelize from '../config/db.js';
import User from './User.js';
import Room from './Room.js';
import Player from './Player.js';
import Transaction from './Transaction.js';

// Relations
Room.hasMany(Player, { foreignKey: 'room_id' });
Player.belongsTo(Room, { foreignKey: 'room_id' });

User.hasMany(Player, { foreignKey: 'user_id' });
Player.belongsTo(User, { foreignKey: 'user_id' });

Room.hasMany(Transaction, { foreignKey: 'room_id' });
Transaction.belongsTo(Room, { foreignKey: 'room_id' });

const syncDB = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log('Database synced');
  } catch (error) {
    console.error('Error syncing database:', error);
  }
};

export { sequelize, User, Room, Player, Transaction, syncDB };
