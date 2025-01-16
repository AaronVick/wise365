// pages/admin/usageStats.js

import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function UsageStats() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    roles: { Manager: 0, Member: 0 },
  });
  const [teamData, setTeamData] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [agentStats, setAgentStats] = useState({ last30Days: [], lifetime: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch users
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const users = usersSnapshot.docs.map((doc) => doc.data());

        // Aggregate role stats
        const roleCounts = users.reduce(
          (acc, user) => {
            acc[user.role] = (acc[user.role] || 0) + 1;
            return acc;
          },
          { Manager: 0, Member: 0 }
        );

        // Aggregate monthly stats for new users
        const now = new Date();
        const monthlyCounts = Array(12).fill(0);
        users.forEach((user) => {
          const createdAt = user.createdAt?.toDate?.();
          if (createdAt) {
            const monthDiff = now.getMonth() - createdAt.getMonth() + (12 * (now.getFullYear() - createdAt.getFullYear()));
            if (monthDiff >= 0 && monthDiff < 12) {
              monthlyCounts[11 - monthDiff]++;
            }
          }
        });

        setMonthlyStats(
          monthlyCounts.map((count, index) => ({
            month: new Date(now.getFullYear(), now.getMonth() - (11 - index), 1).toLocaleString('default', { month: 'short' }),
            count,
          }))
        );

        setStats({
          totalUsers: users.length,
          roles: roleCounts,
        });

        // Fetch teams
        const teamsSnapshot = await getDocs(collection(db, 'teams'));
        const teams = teamsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setTeamData(teams);

        // Fetch conversations
        const conversationsSnapshot = await getDocs(collection(db, 'conversations'));
        const conversations = conversationsSnapshot.docs.map((doc) => doc.data());

        const last30Days = new Date();
        last30Days.setDate(last30Days.getDate() - 30);

        const agentStatsLast30Days = conversations.reduce((acc, conversation) => {
          const { agentId, timestamp } = conversation;
          if (timestamp?.toDate?.() >= last30Days) {
            acc[agentId] = (acc[agentId] || 0) + 1;
          }
          return acc;
        }, {});

        const agentStatsLifetime = conversations.reduce((acc, conversation) => {
          const { agentId } = conversation;
          acc[agentId] = (acc[agentId] || 0) + 1;
          return acc;
        }, {});

        setAgentStats({
          last30Days: Object.entries(agentStatsLast30Days).map(([agentId, interactions]) => ({ agentId, interactions })).sort((a, b) => b.interactions - a.interactions),
          lifetime: Object.entries(agentStatsLifetime).map(([agentId, interactions]) => ({ agentId, interactions })).sort((a, b) => b.interactions - a.interactions),
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
        setError('Failed to load usage statistics. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Usage Statistics</h2>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="p-6 bg-white shadow rounded">
          <h3 className="text-lg font-semibold">Total Users</h3>
          <p>{stats.totalUsers}</p>
        </div>
        <div className="p-6 bg-white shadow rounded">
          <h3 className="text-lg font-semibold">Roles Breakdown</h3>
          <p>Managers: {stats.roles.Manager}</p>
          <p>Members: {stats.roles.Member}</p>
        </div>
      </div>

      <div style={{ width: '100%', height: 400 }} className="mb-6">
        <ResponsiveContainer>
          <BarChart
            data={[ { role: 'Manager', count: stats.roles.Manager }, { role: 'Member', count: stats.roles.Member }]}
            layout="vertical"
            margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
          >
            <XAxis type="number" />
            <YAxis type="category" dataKey="role" width={150} />
            <Tooltip formatter={(value) => `${value} users`} />
            <Bar dataKey="count" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ width: '100%', height: 400 }} className="mb-6">
        <ResponsiveContainer>
          <LineChart data={monthlyStats} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => `${value} users`} />
            <Line type="monotone" dataKey="count" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h3 className="text-lg font-semibold">Agent Stats</h3>

        <h4 className="text-md font-medium mt-4">Last 30 Days</h4>
        <ul>
          {agentStats.last30Days.map(({ agentId, interactions }) => (
            <li key={agentId} className="border-b py-2">
              Agent: {agentId}, Interactions: {interactions}
            </li>
          ))}
        </ul>

        <h4 className="text-md font-medium mt-4">Lifetime</h4>
        <ul>
          {agentStats.lifetime.map(({ agentId, interactions }) => (
            <li key={agentId} className="border-b py-2">
              Agent: {agentId}, Interactions: {interactions}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
