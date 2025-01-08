// pages/admin/chat.js

import { useState, useEffect, useRef } from 'react';

export default function Chat() {
  const [agents, setAgents] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [selectedLLM, setSelectedLLM] = useState('chatGPT'); // Default to ChatGPT
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const messagesEndRef = useRef(null);

  const llmOptions = ['chatGPT', 'Anthropic'];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  useEffect(() => {
    async function fetchInitialData() {
      setLoading(true);
      setError(null);
      try {
        // Fetch agents
        const agentsRes = await fetch('/api/admin?tab=agents');
        if (!agentsRes.ok) throw new Error('Failed to fetch agents');
        const agentsData = await agentsRes.json();
        console.log('Fetched agents:', agentsData);
        setAgents(agentsData || []);
  
        // Fetch conversations
        const conversationsRes = await fetch('/api/admin/messages');
        if (!conversationsRes.ok) throw new Error('Failed to fetch conversations');
        const messagesData = await conversationsRes.json();
        console.log('Fetched messages:', messagesData);
  
        // Group conversations by chatName, using 'Default Chat' for empty chatNames
        const groupedConversations = messagesData.reduce((acc, msg) => {
          // Use 'Default Chat' for empty strings or undefined chatName
          const chatName = msg.chatName || msg.conversationName || 'Default Chat';
          console.log('Processing message:', msg, 'into chatName:', chatName);
          if (!acc[chatName]) {
            acc[chatName] = [];
          }
          acc[chatName].push(msg);
          return acc;
        }, {});
  
        console.log('Grouped conversations:', groupedConversations);
  
        const conversationList = Object.entries(groupedConversations).map(
          ([name, messages]) => ({
            name,
            messages: messages.map((m) => ({
              content: m.conversation,
              from: m.from,
              timestamp: m.timestamp,
            })),
          })
        );
  
        console.log('Final conversation list:', conversationList);
        setConversations(conversationList);
  
        // If there's a Default Chat, automatically select it
        const defaultChat = conversationList.find(conv => conv.name === 'Default Chat');
        console.log('Found default chat:', defaultChat);
        if (defaultChat) {
          handleConversationSelection(defaultChat);
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
        setError('Failed to load initial data: ' + error.message);
      } finally {
        setLoading(false);
      }
    }
    fetchInitialData();
  }, []);
  const handleConversationSelection = (conversation) => {
    // Don't allow conversation selection if no agent is selected
    if (!selectedAgent) {
      setError("Please select an agent first");
      return;
    }
  
    setSelectedConversation(conversation);
    // Sort messages by timestamp if available
    const sortedMessages = [...conversation.messages]
      .filter(msg => msg.from === 'admin' || msg.from === selectedAgent) // Only show messages for selected agent
      .sort((a, b) => {
        if (a.timestamp && b.timestamp) {
          return new Date(a.timestamp) - new Date(b.timestamp);
        }
        return 0;
      });
    
    setChatMessages(
      sortedMessages.map((msg) => ({
        user: msg.from === 'admin' ? msg.content : null,
        bot: msg.from !== 'admin' ? msg.content : null,
      }))
    );
  };

  const handleAgentSelection = async (agentId) => {
    setLoading(true);
    setError(null);
    
    try {
      setSelectedAgent(agentId);
      console.log('Selected agent:', agentId);
      console.log('Current conversations:', conversations);
      
      // Find existing conversation for this agent in Default Chat
      const defaultConversation = conversations.find(
        (conv) => {
          console.log('Checking conversation:', conv);
          const hasAgentMessage = conv.messages.some(msg => {
            console.log('Checking message:', msg, 'against agent:', agentId);
            return msg.from === agentId;
          });
          return conv.name === 'Default Chat' && hasAgentMessage;
        }
      );
      
      console.log('Found default conversation:', defaultConversation);
      
      if (defaultConversation) {
        // Filter messages for selected agent
        const agentMessages = defaultConversation.messages.filter(
          msg => msg.from === 'admin' || msg.from === agentId
        );
        
        console.log('Filtered agent messages:', agentMessages);
        
        setSelectedConversation({
          ...defaultConversation,
          messages: agentMessages
        });
        
        // Sort and set messages
        const sortedMessages = [...agentMessages].sort((a, b) => {
          if (a.timestamp && b.timestamp) {
            return new Date(a.timestamp) - new Date(b.timestamp);
          }
          return 0;
        });
        
        console.log('Sorted messages:', sortedMessages);
        
        setChatMessages(
          sortedMessages.map((msg) => ({
            user: msg.from === 'admin' ? msg.content : null,
            bot: msg.from !== 'admin' ? msg.content : null,
          }))
        );
      } else {
        // If no existing conversation, just clear the messages
        setSelectedConversation(null);
        setChatMessages([]);
      }
    } catch (error) {
      console.error('Error selecting agent:', error);
      setError('Failed to select agent: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedAgent || !chatInput.trim()) {
      alert('Please select an agent and enter a message.');
      return;
    }
  
    setLoading(true);
    setError(null);
  
    try {
      const agentRes = await fetch(`/api/admin?tab=agents&agentId=${selectedAgent}`);
      if (!agentRes.ok) throw new Error('Failed to fetch agent data');
  
      const agentData = await agentRes.json();
      const llmKey = selectedLLM === 'chatGPT' ? 'openAI' : 'Anthropic';
      const promptData = agentData.prompt?.[llmKey];
      if (!promptData?.description) {
        throw new Error(`No prompt found for agent ${selectedAgent} and LLM ${selectedLLM}`);
      }
  
      const systemPrompt = promptData.description;
  
      const res = await fetch('/api/admin/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: selectedAgent,
          message: chatInput,
          prompt: systemPrompt,
          conversationId: selectedConversation?.id || null,
          llm: selectedLLM,
        }),
      });
  
      let data;
      try {
        data = await res.json();
      } catch (e) {
        throw new Error('Failed to parse server response');
      }
  
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send message');
      }
  
      const { reply, conversationId } = data;
      if (!reply) {
        throw new Error('No reply received from server');
      }
  
      // Update chat messages in UI
      setChatMessages((prev) => [
        ...prev, 
        { user: chatInput, bot: null }, // User message
        { user: null, bot: reply } // Bot response
      ]);
      
      setChatInput('');
  
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Chat with Agents</h2>
      {error && <div className="text-red-500 mb-4">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <select
          className="p-2 border rounded"
          value={selectedAgent || ''}
          onChange={(e) => handleAgentSelection(e.target.value)}
        >
          <option value="" disabled>Select an Agent</option>
          {agents.map((agent) => (
            <option key={agent.agentId} value={agent.agentId}>
              {agent.agentName}
            </option>
          ))}
        </select>

        <select
          className="p-2 border rounded"
          value={selectedConversation?.name || ''}
          onChange={(e) => {
            const conv = conversations.find((c) => c.name === e.target.value);
            if (conv) handleConversationSelection(conv);
          }}
        >
          <option value="Default Chat">Default Chat</option>
          {conversations.map((conv) => (
            <option key={conv.name} value={conv.name}>
              {conv.name}
            </option>
          ))}
        </select>

        <select
          className="p-2 border rounded"
          value={selectedLLM}
          onChange={(e) => setSelectedLLM(e.target.value)}
        >
          {llmOptions.map((llm) => (
            <option key={llm} value={llm}>
              {llm}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white shadow rounded p-6">
        {chatMessages.map((msg, idx) => (
          <div key={idx} className={`mb-4 ${msg.user ? 'text-right' : 'text-left'}`}>
            {msg.user && <div className="bg-blue-100 p-2 rounded inline-block">{msg.user}</div>}
            {msg.bot && <div className="bg-gray-100 p-2 rounded inline-block">{msg.bot}</div>}
          </div>
        ))}
        <div ref={messagesEndRef}></div>
      </div>

      <div className="mt-4 flex gap-2">
        <textarea
          className="flex-1 p-2 border rounded"
          rows="3"
          placeholder="Type your message..."
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
        />
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={handleSendMessage}
          disabled={!chatInput.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}
