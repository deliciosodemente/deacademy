import { postgresManager } from '../../../../lib/postgresql-manager.js';
import { auth0Manager } from '../../../../lib/auth0-manager.js';

const getProfile = async (req, res) => {
    try {
        const userId = req.auth.sub;
        const { rows } = await postgresManager.query('SELECT id, name, email, level, progress, courses_completed, lessons_completed FROM users WHERE id = $1', [userId]);

        if (rows.length === 0) {
            // If user not in DB, fetch from Auth0 and sync
            const userProfile = await auth0Manager.getUser(userId);
            await auth0Manager.syncUserWithDatabase(userProfile);
            const { rows: newRows } = await postgresManager.query('SELECT id, name, email, level, progress, courses_completed, lessons_completed FROM users WHERE id = $1', [userId]);
            return res.json(newRows[0]);
        }

        res.json(rows[0]);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export { getProfile };