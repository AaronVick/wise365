import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase'; // Correct import path for Firebase configuration
import { collection, doc, getDocs, getDoc, updateDoc } from 'firebase/firestore';

export default function Prompts() {
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [prompts, setPrompts] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch agents on mount
    const fetchAgents = async () => {
      setLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, 'agentsDefined'));
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

  const handleAgentSelection = async (agentId) => {
    setSelectedAgent(agentId);
    setLoading(true);
    try {
      const agentDoc = doc(db, 'agentsDefined', agentId);
      const agentData = (await getDoc(agentDoc)).data();
      setPrompts(agentData?.prompt || null);
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
      const updatedPrompts = { ...prompts, [version]: { ...prompts[version], description: newPrompt } };
      await updateDoc(agentDoc, { prompt: updatedPrompts });
      setPrompts(updatedPrompts);
      alert('Prompt updated successfully!');
    } catch (err) {
      console.error('Error updating prompt:', err);
      alert('Failed to update prompt. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Manage Prompts</h2>
      {error && <div className="text-red-500">{error}</div>}

      {/* Agent Selection Dropdown */}
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
            {agent.agentId}
          </option>
        ))}
      </select>

       {/* Prompt Management Section */}
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
                onClick={handleSavePrompt}
              >
                Save & Update Agent Prompt
              </button>
            </div>
          )}

          {promptHistory && Object.keys(promptHistory).length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Prompt History:</h4>
              {Object.entries(promptHistory).map(([llm, history]) => (
                <div key={llm} className="mb-4">
                  <h5 className="font-medium">{llm}:</h5>
                  {history.map((entry, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded mb-2">
                      <div className="text-sm text-gray-600 mb-1">
                        Updated: {new Date(entry.timestamp).toLocaleString()}
                      </div>
                      <div className="whitespace-pre-wrap">{entry.prompt}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>


      {/* Display Prompts for the Selected Agent */}
      {selectedAgent && prompts && (
        <div>
          <h3 className="text-lg font-bold mb-4">Prompts for Agent: {selectedAgent}</h3>
          {Object.entries(prompts).map(([version, promptData]) => (
            <div key={version} className="p-4 bg-gray-100 rounded shadow mb-4">
              <h4 className="font-bold text-lg">{version}</h4>
              <textarea
                className="w-full p-2 border rounded mt-2"
                rows="6"
                value={promptData.description}
                onChange={(e) => {
                  const newPrompt = e.target.value;
                  handlePromptUpdate(version, newPrompt);
                }}
              />
              <button
                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={() => handlePromptUpdate(version, promptData.description)}
              >
                Save Changes
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
