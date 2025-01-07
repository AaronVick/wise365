import { useEffect, useState } from 'react';

export default function Training() {
  const [data, setData] = useState([]);
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);

  useEffect(() => {
    async function fetchAgents() {
      const res = await fetch('/api/admin/agents');
      const result = await res.json();
      setAgents(result || []);
    }
    fetchAgents();
  }, []);

  const handleAgentSelection = async (agentId) => {
    setSelectedAgent(agentId);
    const res = await fetch(`/api/admin/training?agentId=${agentId}`);
    const trainingData = await res.json();
    setData(trainingData || []);
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
          Select an Agent
        </option>
        {agents.map((agent) => (
          <option key={agent.agentId} value={agent.agentId}>
            {agent.agentName}
          </option>
        ))}
      </select>
      {data.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((item, idx) => (
            <div key={idx} className="p-4 bg-gray-100 shadow rounded">
              <h3>{item.dataType}</h3>
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
