import { useState, useEffect } from 'react';

export default function Chat() {
  const [agents, setAgents] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [agentPersona, setAgentPersona] = useState(null);

  // Fetch agents on mount
  useEffect(() => {
    async function fetchAgents() {
      try {
        const res = await fetch('/api/admin?tab=agents');
        if (!res.ok) throw new Error('Failed to fetch agents');
        const agentsData = await res.json();
        setAgents(agentsData || []);
      } catch (error) {
        console.error('Error fetching agents:', error);
        setAgents([]);
      }
    }
    fetchAgents();
  }, []);

  // Fetch agent persona and previous messages when agent changes
  useEffect(() => {
    if (!selectedAgent) {
      setAgentPersona(null);
      setChatMessages([]);
      return;
    }

    async function fetchAgentDetails() {
      try {
        const personaRes = await fetch(`/api/admin/agentDetails?agentId=${selectedAgent}`);
        if (!personaRes.ok) throw new Error('Failed to fetch agent persona');
        const persona = await personaRes.json();
        setAgentPersona(persona);

        const chatRes = await fetch(`/api/admin/chat?agentId=${selectedAgent}`);
        if (!chatRes.ok) throw new Error('Failed to fetch chat messages');
        const messages = await chatRes.json();
        setChatMessages(messages || []);
      } catch (error) {
        console.error('Error fetching agent details:', error);
        setAgentPersona(null);
        setChatMessages([]);
      }
    }
    fetchAgentDetails();
  }, [selectedAgent]);

  const handleSendMessage = async () => {
    if (!selectedAgent) {
      alert('Please select an agent to chat with.');
      return;
    }

    try {
      const prompt = agentPersona
        ? `${agentPersona.description}\n\nUser: ${chatInput}\nAgent:`
        : `User: ${chatInput}\nAgent:`;

      const res = await fetch('/api/admin/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: selectedAgent, message: chatInput, prompt }),
      });

      if (!res.ok) {
        const errorDetails = await res.json();
        console.error('Failed to send message:', errorDetails);
        alert(`Failed to send the message: ${errorDetails.error || 'Unknown error'}`);
        return;
      }

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
          {agents.length === 0 ? 'No agents available' : 'Select an Agent'}
        </option>
        {agents.map((agent) => (
          <option key={agent.id} value={agent.id}>
            {agent.agentName}: {agent.Role}
          </option>
        ))}
      </select>

      <div className="p-4 bg-gray-100 shadow rounded mb-4 h-64 overflow-y-auto">
        {chatMessages.map((msg, idx) => (
          <div key={idx}>
            <p>
              <strong>You:</strong> {msg.user}
            </p>
            <p>
              <strong>Bot:</strong> {msg.bot}
            </p>
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
