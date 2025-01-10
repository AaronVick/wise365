import { Configuration, OpenAIApi } from 'openai';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { userId, conversations, agents, currentGoals } = req.body;

        const configuration = new Configuration({
            apiKey: process.env.OPENAI_API_KEY,
        });
        const openai = new OpenAIApi(configuration);

        // Format the context for the LLM
        const context = `
            System: You are Shawn, the Tool Guidance Assistant. Your role is to analyze user activity and suggest appropriate goals based on the Business Wise365 tools and agents available.
            
            Available Agents and their Capabilities:
            ${agents.map(agent => `
                - ${agent.agentName} (${agent.Role}): ${agent.About}
                Tasks: ${agent.tasks.join(', ')}
            `).join('\n')}
            
            Current User Context:
            - Recent Conversations: ${conversations.map(conv => `${conv.agentId}: ${conv.content}`).join('\n')}
            - Current Goals: ${currentGoals.map(goal => goal.description).join('\n')}
            
            Task: Analyze this information and suggest 1-3 new goals that would be valuable for the user. Consider:
            1. Don't suggest goals similar to current goals
            2. Prioritize goals that build on recent conversations
            3. Match goals with the most appropriate agent
            4. Keep suggestions practical and actionable
            
            Format each goal as: {description: "goal description", agentAssigned: "agent-id"}
        `;

        const completion = await openai.createChatCompletion({
            model: 'gpt-4',
            messages: [
                { role: 'system', content: context },
                { role: 'user', content: 'Analyze the context and suggest appropriate goals.' }
            ],
            temperature: 0.7,
        });

        const suggestions = JSON.parse(completion.data.choices[0].message.content);
        return res.status(200).json(suggestions);
    } catch (error) {
        console.error('Error in analyze-user-context:', error);
        return res.status(500).json({ error: 'Failed to analyze user context' });
    }
}