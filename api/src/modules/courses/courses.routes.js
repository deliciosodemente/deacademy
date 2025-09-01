import express from 'express';
import * as coursesController from './courses.js';
const router = express.Router();

// /api/courses
router.get('/', coursesController.getCourses);

// /api/courses/:id
router.get('/:id', coursesController.getCourseById);

export default router;