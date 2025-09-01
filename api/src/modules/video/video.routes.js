import express from 'express';
import { checkJwt } from '../../utils/auth.js';
import * as videoController from './video.js';
const router = express.Router();

// Video streaming endpoints
router.post('/signed-url', checkJwt, videoController.getSignedUrl);
router.get('/course/:courseId/videos', checkJwt, videoController.listCourseVideos);
router.get('/health', videoController.healthCheck);

export default router;