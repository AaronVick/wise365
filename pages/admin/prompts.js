// pages/admin/prompts.js

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, doc, getDocs, getDoc, setDoc, updateDoc } from 'firebase/firestore';

export default function Prompts() {
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [selectedLLM, setSelectedLLM] = useState('');
  const [prompts, setPrompts] = useState(null);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [generatingPrompt, setGeneratingPrompt] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAgents = async () => {
      setLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, 'agents'));
        const agentList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAgents(agentList);
      } catch (err) {
        console.error('Error fetching agents:', err);
        setError('Failed to fetch agents.');
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, []);

  const fetchAgentDefinition = async (agentId) => {
    try {
      const docRef = doc(db, 'agentsDefined', agentId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? docSnap.data() : null;
    } catch (err) {
      console.error('Error fetching agent definition:', err);
      return null;
    }
  };

  const handleAgentSelection = async (agentId) => {
    setSelectedAgent(agentId);
    setLoading(true);
    try {
      const agentDefinition = await fetchAgentDefinition(agentId);
      setPrompts(agentDefinition?.prompt || null);
    } catch (err) {
      console.error('Error fetching prompts:', err);
      setError('Failed to fetch prompts for the selected agent.');
    } finally {
      setLoading(false);
    }
  };

  const handlePromptUpdate = async (version, newPrompt) => {
    if (!selectedAgent) return;
    setLoading(true);
    try {
      const agentDoc = doc(db, 'agentsDefined', selectedAgent);
      const currentData = await getDoc(agentDoc);
      const existingPrompts = currentData.exists() ? currentData.data().prompt || {} : {};
      
      const updatedPrompts = {
        ...existingPrompts,
        [selectedLLM]: {
          description: newPrompt,
          version: getLLMVersion(selectedLLM)
        }
      };

      if (currentData.exists()) {
        await updateDoc(agentDoc, { prompt: updatedPrompts });
      } else {
        await setDoc(agentDoc, { 
          agentId: agents.find(a => a.id === selectedAgent)?.agentName,
          prompt: updatedPrompts,
          lastUpdated: new Date()
        });
      }
      
      setPrompts(updatedPrompts);
      alert('Prompt updated successfully!');
    } catch (err) {
      console.error('Error updating prompt:', err);
      alert('Failed to update prompt. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getLLMVersion = (llm) => {
    switch(llm) {
      case 'Anthropic':
        return 'Claude-3_5-Sonet';
      case 'OpenAI':
        return 'ChatGPT-4o';
      default:
        return '';
    }
  };

  const handleGeneratePrompt = async () => {
    if (!selectedAgent || !selectedLLM) {
      alert('Please select an agent and LLM before generating a prompt.');
      return;
    }

    setGeneratingPrompt(true);
    try {
      // Fetch all agent data
      const agentData = await fetchAgentData(selectedAgent);
      const selectedAgentInfo = agents.find(a => a.id === selectedAgent);
      
      // Prepare the API request based on selected LLM
      const endpoint = selectedLLM === 'Anthropic' ? '/api/claude' : '/api/chatgpt';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentInfo: selectedAgentInfo,
          agentData: agentData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate prompt');
      }

      const data = await response.json();
      setGeneratedPrompt(data.prompt);
    } catch (err) {
      console.error('Error generating prompt:', err);
      alert('Failed to generate prompt. Please try again.');
    } finally {
      setGeneratingPrompt(false);
    }
  };

  const fetchAgentData = async (agentId) => {
    try {
      const querySnapshot = await getDocs(collection(db, 'agentData'));
      return querySnapshot.docs
        .map(doc => doc.data())
        .filter(data => data.agentId === agentId);
    } catch (err) {
      console.error('Error fetching agent data:', err);
      return [];
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Manage Prompts</h2>
      {error && <div className="text-red-500">{error}</div>}

      <select
        className="p-2 border rounded w-full mb-4"
        value={selectedAgent || ''}
        onChange={(e) => handleAgentSelection(e.target.value)}
      >
        <option value="" disabled>Select an Agent</option>
        {agents.map((agent) => (
          <option key={agent.id} value={agent.id}>
            {agent.agentName}
          </option>
        ))}
      </select>

      <select
        className="p-2 border rounded w-full mb-4"
        value={selectedLLM}
        onChange={(e) => setSelectedLLM(e.target.value)}
        disabled={!selectedAgent}
      >
        <option value="" disabled>Select LLM</option>
        <option value="Anthropic">Anthropic (Claude)</option>
        <option value="OpenAI">OpenAI (ChatGPT)</option>
      </select>

      <div className="mb-8 bg-white shadow rounded p-6">
        <h3 className="text-xl font-semibold mb-4">Prompt Management</h3>
        <div className="grid grid-cols-1 gap-4">
          <div className="flex gap-4">
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
              onClick={handleGeneratePrompt}
              disabled={!selectedAgent || !selectedLLM || generatingPrompt}
            >
              {generatingPrompt ? 'Generating...' : 'Generate New Prompt'}
            </button>
          </div>

          {generatedPrompt && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Generated Prompt:</h4>
              <div className="bg-gray-50 p-4 rounded mb-4 whitespace-pre-wrap">
                {generatedPrompt}
              </div>
              <button
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                onClick={() => handlePromptUpdate(selectedLLM, generatedPrompt)}
              >
                Save & Update Agent Prompt
              </button>
            </div>
          )}
        </div>
      </div>

      {selectedAgent && prompts && (
        <div>
          <h3 className="text-lg font-bold mb-4">
            Current Prompts for Agent: {agents.find(a => a.id === selectedAgent)?.agentName}
          </h3>
          {Object.entries(prompts).map(([llmType, promptData]) => (
            <div key={llmType} className="p-4 bg-gray-100 rounded shadow mb-4">
              <h4 className="font-bold text-lg">{llmType} ({promptData.version})</h4>
              <textarea
                className="w-full p-2 border rounded mt-2"
                rows="6"
                value={promptData.description}
                onChange={(e) => {
                  const newPrompt = e.target.value;
                  handlePromptUpdate(llmType, newPrompt);
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}