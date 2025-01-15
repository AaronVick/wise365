// pages/admin/prompts.js

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

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
        console.log('Fetched agents:', agentList);
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

  const fetchAgentDefinition = async (selectedDocId) => {
    try {
      // First, get the agentId from the selected agent record
      const selectedAgent = agents.find(agent => agent.id === selectedDocId);
      if (!selectedAgent) {
        console.error('Selected agent not found');
        return null;
      }

      const agentId = selectedAgent.agentId;
      console.log('Looking up definition for agentId:', agentId);

      // Query agentsDefined collection using the agentId field
      const agentsDefinedRef = collection(db, 'agentsDefined');
      const q = query(agentsDefinedRef, where('agentId', '==', agentId));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.log('No matching definition found for agentId:', agentId);
        return null;
      }

      const definitionDoc = querySnapshot.docs[0];
      const data = definitionDoc.data();
      
      console.log('Found definition:', data);
      console.log('Prompts:', data.prompt);

      return data;
    } catch (err) {
      console.error('Error fetching agent definition:', err);
      return null;
    }
  };

  const handleAgentSelection = async (selectedDocId) => {
    console.log('Selected doc ID:', selectedDocId);
    setSelectedAgent(selectedDocId);
    setLoading(true);
    setError(null);

    try {
      const agentDefinition = await fetchAgentDefinition(selectedDocId);
      
      if (agentDefinition && agentDefinition.prompt) {
        console.log('Setting prompts:', agentDefinition.prompt);
        setPrompts(agentDefinition.prompt);
      } else {
        console.log('No prompts found');
        setPrompts({});
      }
    } catch (err) {
      console.error('Error:', err);
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


  const fetchAgentData = async (selectedDocId) => {
    try {
      // First get the agentId from the selected agent
      const selectedAgent = agents.find(agent => agent.id === selectedDocId);
      if (!selectedAgent) {
        console.error('Selected agent not found');
        return [];
      }
  
      const agentId = selectedAgent.agentId;
      console.log('Fetching data for agentId:', agentId);
  
      // Query agentData collection using agentId
      const querySnapshot = await getDocs(
        query(collection(db, 'agentData'), 
        where('agentId', '==', agentId))
      );
  
      const data = querySnapshot.docs.map(doc => doc.data());
      console.log('Found agent data:', data);
      return data;
    } catch (err) {
      console.error('Error fetching agent data:', err);
      return [];
    }
  };
  
  const handleGeneratePrompt = async () => {
    if (!selectedAgent || !selectedLLM) {
      alert('Please select an agent and LLM before generating a prompt.');
      return;
    }
  
    setGeneratingPrompt(true);
    try {
      // Get selected agent info
      const selectedAgentInfo = agents.find((a) => a.id === selectedAgent);
      if (!selectedAgentInfo) {
        throw new Error('Selected agent info not found');
      }
  
      // Fetch agent data using agentId
      const agentData = await fetchAgentData(selectedAgent);
      console.log('Agent Info:', selectedAgentInfo);
      console.log('Agent Data:', agentData);
  
      // Prepare system message based on agent role and data
      const systemMessage = `You are an AI prompt engineer. Your task is to create an optimized system prompt for an AI agent with the following characteristics:
  Role: ${selectedAgentInfo.Role || selectedAgentInfo.agentName}
  Description: ${selectedAgentInfo.About || selectedAgentInfo.RoleInfo}
  Additional context from user interactions: ${JSON.stringify(agentData)}
  
  Create a detailed system prompt that will help the AI embody this role effectively.`;
  
      let prompt;
      if (selectedLLM === 'Anthropic') {
        // Call Claude API
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-opus-20240229',
            max_tokens: 1000,
            messages: [{
              role: 'user',
              content: systemMessage
            }]
          })
        });
  
        if (!response.ok) {
          throw new Error(`Anthropic API error: ${response.statusText}`);
        }
  
        const data = await response.json();
        prompt = data.content[0].text;
  
      } else if (selectedLLM === 'OpenAI') {
        // Call OpenAI API
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: 'gpt-4',
            messages: [
              {
                role: 'system',
                content: 'You are an expert prompt engineer.'
              },
              {
                role: 'user',
                content: systemMessage
              }
            ],
            max_tokens: 1000
          })
        });
  
        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.statusText}`);
        }
  
        const data = await response.json();
        prompt = data.choices[0].message.content;
      }
  
      setGeneratedPrompt(prompt);
  
    } catch (err) {
      console.error('Error generating prompt:', err);
      alert(`Failed to generate prompt: ${err.message}`);
    } finally {
      setGeneratingPrompt(false);
    }
  };
  
  const handlePromptUpdate = async (llmType, newPrompt) => {
    if (!selectedAgent || !llmType) return;
    setLoading(true);
  
    try {
      // First get the agent definition using agentId
      const selectedAgentInfo = agents.find(a => a.id === selectedAgent);
      if (!selectedAgentInfo) throw new Error('Selected agent not found');
  
      // Query for the existing agent definition
      const querySnapshot = await getDocs(
        query(collection(db, 'agentsDefined'), 
        where('agentId', '==', selectedAgentInfo.agentId))
      );
  
      let docRef;
      let existingPrompts = {};
  
      if (!querySnapshot.empty) {
        // Update existing document
        docRef = doc(db, 'agentsDefined', querySnapshot.docs[0].id);
        existingPrompts = querySnapshot.docs[0].data().prompt || {};
      } else {
        // Create new document
        docRef = doc(collection(db, 'agentsDefined'));
      }
  
      // Update or add the prompt for the specific LLM
      const updatedPrompts = {
        ...existingPrompts,
        [llmType]: {
          description: newPrompt,
          version: llmType === 'Anthropic' ? 'Claude-3_5-Sonet' : 'ChatGPT-4',
        },
      };
  
      await setDoc(docRef, {
        agentId: selectedAgentInfo.agentId,
        prompt: updatedPrompts,
        lastUpdated: new Date(),
      }, { merge: true });
  
      setPrompts(updatedPrompts);
      alert(`Prompt for ${llmType} updated successfully!`);
    } catch (err) {
      console.error('Error updating prompt:', err);
      alert(`Failed to update prompt: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Manage Prompts</h2>
      {error && <div className="text-red-500">{error}</div>}

      <select
        className="p-2 border rounded w-full mb-4"
        value={selectedAgent || ''}
        onChange={(e) => handleAgentSelection(e.target.value)}
      >
        <option value="" disabled>
          Select an Agent
        </option>
        {agents.map((agent) => (
          <option key={agent.id} value={agent.id}>
            {agent.agentName || agent.Role} (AgentID: {agent.agentId})
          </option>
        ))}
      </select>

      {selectedAgent && agents.find(a => a.id === selectedAgent) && (
        <div className="text-sm text-gray-600 mb-4">
          Debug - Looking up agentId: {agents.find(a => a.id === selectedAgent).agentId}
        </div>
      )}

      {/* Dropdown for selecting LLM */}
      <select
        className="p-2 border rounded w-full mb-4"
        value={selectedLLM}
        onChange={(e) => setSelectedLLM(e.target.value)}
        disabled={!selectedAgent}
      >
        <option value="" disabled>
          Select LLM
        </option>
        <option value="Anthropic">Anthropic (Claude)</option>
        <option value="OpenAI">OpenAI (ChatGPT)</option>
      </select>

      {/* Section for generating new prompt */}
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
            Current Prompts for Agent: {agents.find(a => a.id === selectedAgent)?.agentName || agents.find(a => a.id === selectedAgent)?.Role}
          </h3>
          
          {Object.keys(prompts).length > 0 ? (
            Object.entries(prompts).map(([llmType, promptData]) => (
              <div key={llmType} className="p-4 bg-gray-100 rounded shadow mb-4">
                <h4 className="font-bold text-lg">
                  {llmType} ({promptData.version || 'Unknown Version'})
                </h4>
                <textarea
                  className="w-full p-2 border rounded mt-2"
                  rows="6"
                  value={promptData.description || 'No description provided.'}
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
} 
