import { useState, useEffect } from 'react';

export default function Chat() {
  const [agents, setAgents] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [selectedAgent, setSelectedAgent] = useState(null);

  useEffect(() => {
    async function fetchAgents() {
      const res = await fetch('/api/admin/agents');
      const agentsData = await res.json();
      setAgents(agentsData || []);
    }
    fetchAgents();
  }, []);

  const handleSendMessage = async () => {
    // Chat sending logic here
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Chat with Agents</h2>
      <select
        className="p-2 border rounded w-full mb-4"
        value={selectedAgent || ''}
        onChange={(e) => setSelectedAgent(e.target.value)}
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
      <div className="p-4 bg-gray-100 shadow rounded mb-4 h-64 overflow-y-auto">
        {chatMessages.map((msg, idx) => (
          <div key={idx}>
            <p><strong>You:</strong> {msg.user}</p>
            <p><strong>Bot:</strong> {msg.bot}</p>
          </div>
        ))}
      </div>
      <div className="flex">
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          className="p-2 border rounded w-full mr-2"
        />
        <button
          onClick={handleSendMessage}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Send
        </button>
      </div>
    </div>
  );
}
