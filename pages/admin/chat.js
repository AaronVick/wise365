import { useState, useEffect } from 'react';

export default function Chat() {
  const [agents, setAgents] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [selectedAgent, setSelectedAgent] = useState(null);

  useEffect(() => {
    async function fetchAgents() {
      try {
        const res = await fetch('/api/admin/agents');
        const agentsData = await res.json();
        setAgents(agentsData || []);
      } catch (error) {
        console.error('Error fetching agents:', error);
        setAgents([]); // Fallback to an empty array if fetching fails
      }
    }
    fetchAgents();
  }, []);

  const handleSendMessage = async () => {
    if (!selectedAgent) {
      alert('Please select an agent to chat with.');
      return;
    }

    try {
      const res = await fetch('/api/admin/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: selectedAgent, message: chatInput }),
      });

      if (!res.ok) throw new Error('Failed to send message');

      const { reply } = await res.json();

      setChatMessages((prevMessages) => [
        ...prevMessages,
        { user: chatInput, bot: reply },
      ]);

      setChatInput('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send the message. Please try again.');
    }
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
            {agent.agentName}: {agent.Role}
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
          placeholder="Type a message..."
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
