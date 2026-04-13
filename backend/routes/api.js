import express from 'express';
import { register, login, getMe } from '../controllers/authController.js';
import { createRoom, joinRoom, joinGuest, startGame, bet, fold, show, pass, manualBet, declareWinner, getRoomState } from '../controllers/gameController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// Auth
router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getMe);

// Game setup
router.post('/create-room', authenticate, createRoom);
router.post('/join-room', authenticate, joinRoom);
router.post('/join-guest', authenticate, joinGuest); // offline mode host adding guest
router.get('/room/:id', authenticate, getRoomState);

// Gameplay
router.post('/start-game', authenticate, startGame);
router.post('/bet', authenticate, bet);
router.post('/fold', authenticate, fold);
router.post('/show', authenticate, show);
router.post('/declare-winner', authenticate, declareWinner);

// Offline Pass-Pass mode
router.post('/pass', authenticate, pass);
router.post('/manual-bet', authenticate, manualBet);

export default router;
