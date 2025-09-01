import { postgresManager } from '../../../../lib/postgresql-manager.js';

const getCourses = async (req, res) => {
    try {
        const { rows } = await postgresManager.query('SELECT * FROM courses');
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({ error: 'Failed to fetch courses' });
    }
};

const getCourseById = async (req, res) => {
    const { id } = req.params;
    try {
        const courseResult = await postgresManager.query('SELECT * FROM courses WHERE id = $1', [id]);
        if (courseResult.rows.length === 0) {
            return res.status(404).json({ error: 'Course not found' });
        }
        const course = courseResult.rows[0];

        const lessonsResult = await postgresManager.query('SELECT * FROM lessons WHERE course_id = $1 ORDER BY lesson_number', [id]);
        course.lessons = lessonsResult.rows;

        res.status(200).json(course);
    } catch (error) {
        console.error(`Error fetching course ${id}:`, error);
        res.status(500).json({ error: 'Failed to fetch course' });
    }
};

export { getCourses, getCourseById };