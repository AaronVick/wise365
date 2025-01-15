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
      if (!docSnap.exists()) return null;
      const data = docSnap.data();
      return {
        ...data,
        prompt: data.prompt || {}, // Ensure prompt is a valid object
      };
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
      setPrompts(agentDefinition?.prompt || {});
    } catch (err) {
      console.error('Error fetching prompts:', err);
      setError('Failed to fetch prompts for the selected agent.');
    } finally {
      setLoading(false);
    }
  };
  

  const handlePromptUpdate = async (llmType, newPrompt) => {
    if (!selectedAgent || !llmType) return; // Ensure valid agent and LLM type
    setLoading(true);
  
    try {
      // Fetch existing data for the selected agent
      const agentDoc = doc(db, 'agentsDefined', selectedAgent);
      const currentData = await getDoc(agentDoc);
      const existingPrompts = currentData.exists() ? currentData.data().prompt || {} : {};
  
      // Update or add the prompt for the specific LLM
      const updatedPrompts = {
        ...existingPrompts,
        [llmType]: {
          description: newPrompt,
          version: getLLMVersion(llmType), // Ensure version consistency for the LLM
        },
      };
  
      if (currentData.exists()) {
        // Update the existing Firestore document
        await updateDoc(agentDoc, { 
          prompt: updatedPrompts,
          lastUpdated: new Date(),
        });
      } else {
        // Create a new document if it doesn't exist
        await setDoc(agentDoc, {
          agentId: agents.find((a) => a.id === selectedAgent)?.agentName,
          prompt: updatedPrompts,
          lastUpdated: new Date(),
        });
      }
  
      setPrompts(updatedPrompts); // Update the state to reflect the changes
      alert(`Prompt for ${llmType} updated successfully!`);
    } catch (err) {
      console.error('Error updating prompt:', err);
      alert('Failed to update prompt. Please try again.');
    } finally {
      setLoading(false);
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
      const selectedAgentInfo = agents.find((a) => a.id === selectedAgent);
  
      // Determine API endpoint and key based on selected LLM
      let endpoint = '';
      let headers = {};
      if (selectedLLM === 'Anthropic') {
        endpoint = 'https://api.anthropic.com/v1/claude';
        headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.ANTHROPIC_API_KEY}`, // Use Anthropic API key
        };
      } else if (selectedLLM === 'OpenAI') {
        endpoint = 'https://api.openai.com/v1/chat/completions';
        headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, // Use OpenAI API key
        };
      } else {
        throw new Error('Unsupported LLM selected');
      }
  
      // Prepare the API request payload
      const payload =
        selectedLLM === 'Anthropic'
          ? {
              model: 'claude-v1.3',
              prompt: `Agent Info: ${JSON.stringify(selectedAgentInfo)}\n\nAgent Data: ${JSON.stringify(
                agentData
              )}`,
              max_tokens_to_sample: 1000,
            }
          : {
              model: 'gpt-4',
              messages: [
                { role: 'system', content: 'You are a helpful assistant.' },
                { role: 'user', content: `Agent Info: ${JSON.stringify(selectedAgentInfo)}\n\nAgent Data: ${JSON.stringify(agentData)}` },
              ],
              max_tokens: 1000,
            };
  
      // Send the API request
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
  
      if (!response.ok) {
        throw new Error('Failed to generate prompt');
      }
  
      const data = await response.json();
      const prompt =
        selectedLLM === 'Anthropic'
          ? data.completion // Anthropic response key
          : data.choices?.[0]?.message?.content; // OpenAI response key
  
      setGeneratedPrompt(prompt);
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
        <div className="mt-8 bg-white shadow rounded p-6">
          <h3 className="text-lg font-semibold mb-4">
            Current Prompts for Agent: {agents.find((a) => a.id === selectedAgent)?.agentName}
          </h3>
          {Object.entries(prompts).length > 0 ? (
            Object.entries(prompts).map(([llmType, promptData]) => (
              <div key={llmType} className="p-4 bg-gray-100 rounded shadow mb-4">
                <h4 className="font-bold text-lg">{llmType} ({promptData.version})</h4>
                <textarea
                  className="w-full p-2 border rounded mt-2"
                  rows="6"
                  value={promptData.description}
                  readOnly
                />
              </div>
            ))
          ) : (
            <div className="text-gray-500">No prompts available for this agent.</div>
          )}
        </div>
      )}
    </div>
  );
  