import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { syncDB } from './models/index.js';
import apiRoutes from './routes/api.js';
import { setupSockets } from './sockets/gameSocket.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.set('io', io);

app.use(cors());
app.use(express.json());

app.use('/api', apiRoutes);

setupSockets(io);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  await syncDB();
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
