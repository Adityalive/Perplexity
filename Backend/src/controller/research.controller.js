import { deepResearch } from '../services/researcher.service.js';

export async function runResearch(req, res) {
    try {
        const { topic } = req.body;
        if (!topic?.trim()) {
            return res.status(400).json({ message: 'Topic is required' });
        }

        console.log(`[Research API] User ${req.user.id} researching: "${topic}"`);
        const { report, sources, queries } = await deepResearch(topic.trim());

        return res.status(200).json({ report, sources, queries });
    } catch (error) {
        console.error('[Research API] Error:', error.message);
        return res.status(500).json({ message: error.message || 'Research failed' });
    }
}
