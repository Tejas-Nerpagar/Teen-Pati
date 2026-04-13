import { User } from '../models/index.js';

/**
 * No-auth middleware: reads username from the X-Username header,
 * finds or auto-creates the user, and attaches req.user.
 */
export const identifyUser = async (req, res, next) => {
  const username = req.headers['x-username'];

  if (!username || !username.trim()) {
    return res.status(400).json({ message: 'Username is required. Set the X-Username header.' });
  }

  try {
    const [user] = await User.findOrCreate({
      where: { username: username.trim() },
      defaults: { balance: 100000 },
    });
    req.user = { id: user.id, username: user.username };
    next();
  } catch (error) {
    console.error('identifyUser error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Kept for compatibility — just calls identifyUser
export const authenticate = identifyUser;
