import express from 'express';
import * as aiController from './ai.js';
const router = express.Router();

// /api/ai/chat
router.post('/chat', aiController.chat);

// /api/ai/images
router.post('/images', aiController.images);

export default router;