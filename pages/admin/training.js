import { useEffect, useState } from 'react';

export default function Training() {
  const [data, setData] = useState([]);
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);

  // Fetch agents on mount
  useEffect(() => {
    async function fetchAgents() {
      try {
        const res = await fetch('/api/admin?tab=agents'); // Match the API handler
        if (!res.ok) throw new Error('Failed to fetch agents');
        const result = await res.json();
        console.log("Fetched Agents:", result); // Debugging line
        setAgents(result || []);
      } catch (error) {
        console.error("Error fetching agents:", error);
        setAgents([]); // Fallback to empty array
      }
    }
    fetchAgents();
  }, []);

  // Fetch training data for selected agent
  const handleAgentSelection = async (agentId) => {
    setSelectedAgent(agentId);
    try {
      const res = await fetch(`/api/admin?tab=training&agentId=${agentId}`); // Adjusted query
      if (!res.ok) throw new Error('Failed to fetch training data');
      const trainingData = await res.json();
      setData(trainingData || []);
    } catch (error) {
      console.error("Error fetching training data:", error);
      setData([]); // Fallback to empty array
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Training Data</h2>
      <select
        className="p-2 border rounded w-full mb-4"
        value={selectedAgent || ''}
        onChange={(e) => handleAgentSelection(e.target.value)}
      >
        <option value="" disabled>
          {agents.length === 0 ? 'No agents available' : 'Select an Agent'}
        </option>
        {agents.map((agent) => (
          <option key={agent.id} value={agent.id}>
            {agent.agentName}: {agent.Role}
          </option>
        ))}
      </select>
      {data.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((item, idx) => (
            <div key={idx} className="p-4 bg-gray-100 shadow rounded">
              <h3 className="font-bold">{item.dataType}</h3>
              <p>{item.description}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-600">No training data available.</p>
      )}
    </div>
  );
}
