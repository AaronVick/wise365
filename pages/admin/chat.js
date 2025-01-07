// pages/admin/chat.js

import { useState, useEffect, useRef } from 'react';

export default function Chat() {
  const [agents, setAgents] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [agentPersona, setAgentPersona] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  // Fetch agents on mount
  useEffect(() => {
    async function fetchAgents() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/admin?tab=agents');
        if (!res.ok) throw new Error('Failed to fetch agents');
        const agentsData = await res.json();
        console.log('Fetched agents:', agentsData);
        setAgents(agentsData || []);
      } catch (error) {
        console.error('Error fetching agents:', error);
        setError('Failed to load agents');
        setAgents([]);
      } finally {
        setLoading(false);
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
      setLoading(true);
      setError(null);
      try {
        // Fetch agent training data for persona
        const trainingRes = await fetch(`/api/admin?tab=training&agentId=${selectedAgent}`);
        if (!trainingRes.ok) throw new Error('Failed to fetch agent training data');
        const trainingData = await trainingRes.json();
        console.log('Fetched training data:', trainingData);

        // Find personality data
        const personalityData = trainingData.find(data => data.dataType === 'personality');
        console.log('Found personality data:', personalityData);
        setAgentPersona(personalityData || null);

        // Fetch previous conversations
        const conversationsRes = await fetch(`/api/admin?tab=conversations&agentId=${selectedAgent}`);
        if (!conversationsRes.ok) throw new Error('Failed to fetch conversations');
        const conversations = await conversationsRes.json();
        console.log('Fetched conversations:', conversations);

        // Format messages for display
        const formattedMessages = conversations.flatMap(conv => {
          if (!conv.messages) return [];
          return conv.messages.map(msg => {
            try {
              // Parse the string format into an object
              const msgObj = JSON.parse(`{${msg}}`);
              return {
                user: msgObj.role === 'admin' ? msgObj.content : null,
                bot: msgObj.role === selectedAgent ? msgObj.content : null
              };
            } catch (e) {
              console.error('Error parsing message:', msg, e);
              return null;
            }
          }).filter(msg => msg !== null && (msg.user || msg.bot));
        });

        console.log('Formatted messages:', formattedMessages);
        setChatMessages(formattedMessages);
      } catch (error) {
        console.error('Error fetching agent details:', error);
        setError('Failed to load agent details');
        setAgentPersona(null);
        setChatMessages([]);
      } finally {
        setLoading(false);
      }
    }
    fetchAgentDetails();
  }, [selectedAgent]);

  const handleSendMessage = async () => {
    if (!selectedAgent || !chatInput.trim()) {
      alert('Please select an agent and enter a message.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Construct prompt using agent persona
      let systemPrompt = `You are ${selectedAgent}`;
      
      if (agentPersona) {
        systemPrompt += `\n${agentPersona.description}`;
        if (agentPersona.data?.tone) {
          systemPrompt += `\nTone: ${agentPersona.data.tone}`;
        }
        if (agentPersona.data?.traits?.length) {
          systemPrompt += `\nTraits: ${agentPersona.data.traits.join(', ')}`;
        }
        if (agentPersona.data?.examples) {
          systemPrompt += `\nExample interactions: ${agentPersona.data.examples}`;
        }
      }

      console.log('Sending message with:', { 
        agentId: selectedAgent, 
        message: chatInput,
        systemPrompt 
      });

      const res = await fetch('/api/admin/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: selectedAgent,
          message: chatInput,
          prompt: systemPrompt
        }),
      });

      console.log('Response status:', res.status);
      const responseText = await res.text();
      console.log('Raw response:', responseText);

      if (!res.ok) {
        const errorData = JSON.parse(responseText);
        throw new Error(errorData.error || 'Failed to send message');
      }

      const data = JSON.parse(responseText);
      if (!data.reply) {
        throw new Error('No reply received from server');
      }

      setChatMessages(prev => [...prev, { user: chatInput, bot: data.reply }]);
      setChatInput('');
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Chat with Agents</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <select
        className="p-2 border rounded w-full mb-6"
        value={selectedAgent || ''}
        onChange={(e) => setSelectedAgent(e.target.value)}
        disabled={loading}
      >
        <option value="" disabled>
          {agents.length === 0 ? 'No agents available' : 'Select an Agent'}
        </option>
        {agents.map((agent) => (
          <option key={agent.id} value={agent.agentId}>
            {agent.agentName}: {agent.Role}
          </option>
        ))}
      </select>

      {agentPersona && (
        <div className="bg-blue-50 p-4 rounded mb-6">
          <h3 className="font-semibold mb-2">Agent Personality:</h3>
          <p>{agentPersona.description}</p>
          {agentPersona.data?.traits?.length > 0 && (
            <div className="mt-2">
              <strong>Traits:</strong> {agentPersona.data.traits.join(', ')}
            </div>
          )}
        </div>
      )}

      <div className="bg-white shadow rounded mb-6">
        <div className="p-4 bg-gray-50 border-b">
          {selectedAgent ? (
            <p className="font-medium">
              Chatting with: {agents.find(a => a.agentId === selectedAgent)?.agentName}
            </p>
          ) : (
            <p className="text-gray-500">Select an agent to start chatting</p>
          )}
        </div>

        <div className="p-4 h-[500px] overflow-y-auto">
          {chatMessages.map((msg, idx) => (
            <div key={idx} className="mb-4">
              {msg.user && (
                <div className="flex justify-end mb-2">
                  <div className="bg-blue-100 rounded-lg py-2 px-4 max-w-[80%]">
                    <p className="text-sm">{msg.user}</p>
                  </div>
                </div>
              )}
              {msg.bot && (
                <div className="flex justify-start mb-2">
                  <div className="bg-gray-100 rounded-lg py-2 px-4 max-w-[80%]">
                    <p className="text-sm">{msg.bot}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
          {loading && (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          )}
        </div>

        <div className="p-4 border-t">
          <div className="flex gap-2">
            <textarea
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 p-2 border rounded resize-none"
              placeholder="Type a message..."
              rows="2"
              disabled={!selectedAgent || loading}
            />
            <button
              onClick={handleSendMessage}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
              disabled={!selectedAgent || !chatInput.trim() || loading}
            >
              {loading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}