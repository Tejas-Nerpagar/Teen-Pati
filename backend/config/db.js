import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Sequelize
const sequelize = new Sequelize(
  process.env.DB_NAME || 'teen_patti',
  process.env.DB_USER || 'root',
  process.env.DB_PASS || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false, // set to true to see SQL queries
  }
);

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('MySQL Database connected successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

export default sequelize;
