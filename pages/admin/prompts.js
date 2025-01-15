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
    if (!selectedAgent || !llmType) return;
    setLoading(true);

    try {
      const agent = agents.find(a => a.id === selectedAgent);
      if (!agent) throw new Error('Agent not found');

      // Query for existing document with matching agentId
      const querySnapshot = await getDocs(collection(db, 'agentsDefined'));
      const existingDoc = querySnapshot.docs.find(doc => doc.data().agentId === agent.agentName);

      const promptData = {
        description: newPrompt,
        version: llmType === 'Anthropic' ? 'Claude-3_5-Sonet' : 'ChatGPT-4',
      };

      if (existingDoc) {
        // Update existing document
        const currentData = existingDoc.data();
        const updatedPrompts = {
          ...currentData.prompt,
          [llmType]: promptData,
        };

        await updateDoc(doc(db, 'agentsDefined', existingDoc.id), {
          prompt: updatedPrompts,
          lastUpdated: new Date(),
        });
      } else {
        // Create new document
        const docRef = doc(collection(db, 'agentsDefined'));
        await setDoc(docRef, {
          agentId: agent.agentName,
          prompt: {
            [llmType]: promptData,
          },
          lastUpdated: new Date(),
        });
      }

      // Update local state
      setPrompts(prevPrompts => ({
        ...prevPrompts,
        [llmType]: promptData,
      }));

      alert(`Prompt for ${llmType} updated successfully!`);
    } catch (err) {
      console.error('Error updating prompt:', err);
      setError('Failed to update prompt. Please try again.');
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
        .map((doc) => doc.data())
        .filter((data) => data.agentId === agentId);
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
