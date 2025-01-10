// /pages/api/analyze-chat-history.js
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'Missing userId' });
        }

        // Fetch conversations
        const conversationsRef = collection(db, 'conversations');
        const conversationsQuery = query(
            conversationsRef,
            where('from', '==', userId),
            orderBy('timestamp', 'asc')
        );
        const conversationsSnapshot = await getDocs(conversationsQuery);

        if (conversationsSnapshot.empty) {
            return res.status(200).json({ summary: 'No conversations found for this user.' });
        }

        // Process conversations
        const conversations = conversationsSnapshot.docs.map((doc) => doc.data());
        const groupedData = {};

        conversations.forEach((message) => {
            const { agentId, content, type } = message;

            if (!groupedData[agentId]) {
                groupedData[agentId] = { messages: [], summary: {} };
            }

            if (type === 'agent' || type === 'user') {
                // Ignore basic chatter
                if (content.match(/(hello|hi|how are you|thanks)/i)) return;

                // Add to grouped messages
                groupedData[agentId].messages.push(content);
            }
        });

        // Summarize conversations
        for (const agentId in groupedData) {
            const messages = groupedData[agentId].messages;
            const resolved = messages.filter((msg) => msg.toLowerCase().includes('resolved'));
            const inProgress = messages.filter((msg) => msg.toLowerCase().includes('in progress'));

            groupedData[agentId].summary = {
                resolved: resolved.length ? resolved : 'No resolved items.',
                inProgress: inProgress.length ? inProgress : 'No in-progress items.',
                unresolved: messages.filter((msg) => !resolved.includes(msg) && !inProgress.includes(msg)),
            };
        }

        // Return the grouped and summarized data
        return res.status(200).json({ groupedData });
    } catch (error) {
        console.error('Error analyzing chat history:', error);
        return res.status(500).json({ error: 'Failed to analyze chat history' });
    }
}
