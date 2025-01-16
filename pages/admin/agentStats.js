// pages/admin/agentStats.js

import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function AgentStats() {
  const [agentData, setAgentData] = useState([]);

  useEffect(() => {
    const fetchAgentStats = async () => {
      try {
        // Fetch conversations
        const conversationsSnapshot = await getDocs(collection(db, 'conversations'));
        const conversations = conversationsSnapshot.docs.map((doc) => doc.data());

        // Aggregate data by agentId
        const agentStats = conversations.reduce((acc, conversation) => {
          const agentId = conversation.agentId || 'unknown';
          acc[agentId] = (acc[agentId] || 0) + 1;
          return acc;
        }, {});

        // Convert aggregated data to chart-friendly format
        const totalInteractions = Object.values(agentStats).reduce((sum, count) => sum + count, 0);
        const formattedData = Object.entries(agentStats).map(([agentId, count]) => ({
          agentId,
          count,
          percentage: ((count / totalInteractions) * 100).toFixed(2),
        }));

        setAgentData(formattedData);
      } catch (error) {
        console.error('Error fetching agent stats:', error);
      }
    };

    fetchAgentStats();
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Agent Interaction Statistics</h2>
      <div style={{ width: '100%', height: 400 }}>
        <ResponsiveContainer>
          <BarChart
            data={agentData}
            layout="vertical"
            margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
          >
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="agentId" width={150} />
            <Tooltip formatter={(value, name, props) => `${value} interactions`} />
            <Bar dataKey="percentage" fill="#8884d8" isAnimationActive>
              <Tooltip />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
