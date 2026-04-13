import express from 'express';
import { getMe } from '../controllers/authController.js';
import {
  createRoom, joinRoom, joinGuest, startGame,
  bet, fold, show, pass, manualBet, declareWinner, getRoomState
} from '../controllers/gameController.js';
import { identifyUser } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes use identifyUser — reads X-Username header, auto-creates user
router.get('/me',            identifyUser, getMe);

// Room
router.post('/create-room',  identifyUser, createRoom);
router.post('/join-room',    identifyUser, joinRoom);
router.post('/join-guest',   identifyUser, joinGuest);
router.get('/room/:id',      identifyUser, getRoomState);

// Gameplay
router.post('/start-game',   identifyUser, startGame);
router.post('/bet',          identifyUser, bet);
router.post('/fold',         identifyUser, fold);
router.post('/show',         identifyUser, show);
router.post('/declare-winner', identifyUser, declareWinner);

// Offline Pass-Pass
router.post('/pass',         identifyUser, pass);
router.post('/manual-bet',   identifyUser, manualBet);

export default router;
