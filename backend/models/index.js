import sequelize from '../config/db.js';
import User from './User.js';
import Room from './Room.js';
import Player from './Player.js';
import Transaction from './Transaction.js';

// ─── Associations ───────────────────────────────────────────
// Room ↔ Player
Room.hasMany(Player, { foreignKey: 'room_id' });
Player.belongsTo(Room, { foreignKey: 'room_id' });

// User ↔ Player
User.hasMany(Player, { foreignKey: 'user_id' });
Player.belongsTo(User, { foreignKey: 'user_id' });

// Room ↔ Transaction
Room.hasMany(Transaction, { foreignKey: 'room_id' });
Transaction.belongsTo(Room, { foreignKey: 'room_id' });

// User ↔ Transaction (so tx.User works in includes)
User.hasMany(Transaction, { foreignKey: 'user_id' });
Transaction.belongsTo(User, { foreignKey: 'user_id' });

// User ↔ Room (host)
User.hasMany(Room, { foreignKey: 'host_id' });
Room.belongsTo(User, { as: 'host', foreignKey: 'host_id' });

const syncDB = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log('Database synced');
  } catch (error) {
    console.error('Error syncing database:', error);
  }
};

export { sequelize, User, Room, Player, Transaction, syncDB };
