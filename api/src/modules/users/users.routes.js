import express from 'express';
import { checkJwt } from '../../utils/auth.js';
import * as usersController from './users.js';
const router = express.Router();

// /api/users/profile
router.get('/profile', checkJwt, usersController.getProfile);
router.put('/profile', checkJwt, usersController.updateProfile);

// /api/users/progress
router.post('/progress', checkJwt, usersController.saveProgress);
router.get('/progress', checkJwt, usersController.getProgress);

export default router;