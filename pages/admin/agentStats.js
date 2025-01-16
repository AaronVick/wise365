// pages/admin/agentStats.js
import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function AgentStats() {
  const [agentData, setAgentData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAgentStats = async () => {
      try {
        const conversationsSnapshot = await getDocs(collection(db, 'conversations'));
        const conversations = conversationsSnapshot.docs.map((doc) => doc.data());

        // Aggregate data by agentId with proper null checks
        const agentStats = conversations.reduce((acc, conversation) => {
          const agentId = conversation?.agentId || 'Unknown Agent';
          acc[agentId] = (acc[agentId] || 0) + 1;
          return acc;
        }, {});

        // Convert to chart format with null checks
        const totalInteractions = Object.values(agentStats).reduce((sum, count) => sum + count, 0);
        const formattedData = Object.entries(agentStats)
          .filter(([agentId]) => agentId) // Filter out null/undefined
          .map(([agentId, count]) => ({
            agentId: agentId || 'Unknown Agent',
            count: count || 0,
            percentage: totalInteractions ? ((count / totalInteractions) * 100).toFixed(2) : 0,
          }));

        setAgentData(formattedData);
      } catch (error) {
        console.error('Error fetching agent stats:', error);
        setError('Failed to load agent statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchAgentStats();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (error) {
    return (
      <div className="text-red-500 p-4 rounded-md bg-red-50">
        {error}
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Agent Interaction Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        {agentData.length > 0 ? (
          <div className="w-full h-96"> {/* Fixed height container */}
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={agentData}
                layout="vertical"
                margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
              >
                <XAxis type="number" />
                <YAxis 
                  type="category" 
                  dataKey="agentId" 
                  width={150} 
                />
                <Tooltip />
                <Bar 
                  dataKey="percentage" 
                  fill="#8884d8" 
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-8">
            No agent interaction data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}