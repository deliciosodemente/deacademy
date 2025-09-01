import express from 'express';
import { checkJwt } from '../../utils/auth.js';
import * as authController from './auth.js';
const router = express.Router();

/**
 * @route   GET /api/auth/profile
 * @desc    Get user profile from database
 * @access  Private
 */
router.get('/profile', checkJwt, authController.getProfile);

export default router;