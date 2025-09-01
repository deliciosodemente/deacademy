import { postgresManager } from '../../../../lib/postgresql-manager.js';

const getProfile = async (req, res) => {
    try {
        const userId = req.auth.sub;
        const { rows } = await postgresManager.query('SELECT id, name, email, level, progress, courses_completed, lessons_completed FROM users WHERE id = $1', [userId]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const updateProfile = async (req, res) => {
    try {
        const userId = req.auth.sub;
        const { name, email, level } = req.body;

        const { rows } = await postgresManager.query(
            'UPDATE users SET name = $1, email = $2, level = $3 WHERE id = $4 RETURNING id, name, email, level',
            [name, email, level, userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ success: true, message: 'Perfil actualizado correctamente', data: rows[0] });
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const saveProgress = async (req, res) => {
    try {
        const userId = req.auth.sub;
        const { lesson_id, score, time_spent } = req.body;

        const { rows } = await postgresManager.query(
            'INSERT INTO user_progress (user_id, lesson_id, score, time_spent) VALUES ($1, $2, $3, $4) RETURNING *',
            [userId, lesson_id, score, time_spent]
        );

        res.status(201).json({
            success: true,
            message: 'Progreso guardado',
            data: rows[0]
        });
    } catch (error) {
        console.error('Error saving user progress:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const getProgress = async (req, res) => {
    try {
        const userId = req.auth.sub;
        const { rows } = await postgresManager.query(
            `SELECT 
                COUNT(*) as completed_lessons,
                SUM(time_spent) as total_time,
                AVG(score) as average_score
            FROM user_progress WHERE user_id = $1`,
            [userId]
        );

        const progress = rows[0];

        // Estos valores pueden ser calculados o provenir de otras tablas
        const total_lessons = 50; // Ejemplo
        const streak_days = 7; // Ejemplo
        const achievements = ['First Lesson Complete', 'Week Streak', 'Grammar Master']; // Ejemplo

        res.json({
            total_lessons,
            completed_lessons: parseInt(progress.completed_lessons) || 0,
            total_time: parseInt(progress.total_time) || 0,
            average_score: parseFloat(progress.average_score) || 0,
            streak_days,
            achievements
        });
    } catch (error) {
        console.error('Error fetching user progress:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export { getProfile, updateProfile, saveProgress, getProgress };