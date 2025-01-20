import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function Training() {
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [trainingData, setTrainingData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Fetch agents
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const agentsSnap = await getDocs(collection(db, 'agents'));
        const agentsList = agentsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log('Fetched agents:', agentsList);
        setAgents(agentsList);
      } catch (err) {
        console.error('Error fetching agents:', err);
        setError('Failed to fetch agents');
      }
    };

    fetchAgents();
  }, []);

  // Fetch training data when an agent is selected
  useEffect(() => {
    const fetchTrainingData = async () => {
      if (!selectedAgent) return;
      
      setLoading(true);
      setError(null);
      
      try {
        console.log('Selected agent from dropdown:', selectedAgent);
        
        // Create an array of possible case variations
        const agentVariations = [
          selectedAgent,               // original
          selectedAgent.toLowerCase(), // lowercase
          selectedAgent.toUpperCase(), // uppercase
          selectedAgent.charAt(0).toUpperCase() + selectedAgent.slice(1), // Title Case
        ];
        
        console.log('Trying agent name variations:', agentVariations);
        
        // Query agentData collection using agentId with all case variations
        const q = query(
          collection(db, 'agentData'),
          where('agentId', 'in', agentVariations)
        );
        
        const querySnapshot = await getDocs(q);
        
        // Log the raw query snapshot for debugging
        console.log('Query snapshot size:', querySnapshot.size);
        querySnapshot.forEach(doc => {
          console.log('Document data:', { id: doc.id, ...doc.data() });
        });
        
        const records = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        console.log('Total records found:', records.length);
        console.log('Fetched records:', records);
        
        setTrainingData(records);
      } catch (err) {
        console.error('Error fetching training data:', err);
        setError('Failed to fetch training data');
      } finally {
        setLoading(false);
      }
    };

    fetchTrainingData();
  }, [selectedAgent]);

  const renderTrainingContent = (record) => {
    switch (record.datatype) {
      case 'conversationSteps':
        return (
          <div className="space-y-2">
            <h4 className="font-semibold text-lg">Steps:</h4>
            {Array.isArray(record.steps) && (
              <ol className="list-decimal pl-5 space-y-1">
                {record.steps.map((step, idx) => (
                  <li key={idx} className="text-gray-700">{step}</li>
                ))}
              </ol>
            )}
          </div>
        );
      default:
        return (
          <div className="space-y-2">
            {record.description && (
              <p className="text-gray-700">{record.description}</p>
            )}
            {/* Display any other fields that might be present */}
            {Object.entries(record).map(([key, value]) => {
              if (['id', 'agentId', 'datatype', 'description', 'steps', 'createdAt', 'updatedAt'].includes(key)) return null;
              if (typeof value === 'object') return null;
              return (
                <div key={key} className="flex gap-2">
                  <span className="font-medium capitalize">{key}:</span>
                  <span>{String(value)}</span>
                </div>
              );
            })}
          </div>
        );
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Agent Training Data</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Agent Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Agent
        </label>
        <select
          value={selectedAgent || ''}
          onChange={(e) => {
            const selectedValue = e.target.value;
            console.log('Selected agent from dropdown:', selectedValue);
            setSelectedAgent(selectedValue);
          }}
          className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Select an Agent</option>
          {agents.map((agent) => {
            console.log('Agent in dropdown:', agent);
            return (
              <option key={agent.id} value={agent.agentName || agent.agentId}>
                {agent.agentName || agent.agentId}
              </option>
            );
          })}
        </select>
      </div>

      {/* Training Data Display */}
      {selectedAgent && (
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading training data...</p>
            </div>
          ) : trainingData.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
              {trainingData.map((record) => (
                <div
                  key={record.id}
                  className="bg-white shadow rounded-lg p-6 border border-gray-200"
                >
                  <div className="mb-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold mb-2">
                          {record.datatype}
                        </h3>
                        {record.createdAt && (
                          <p className="text-sm text-gray-500">
                            Created: {new Date(record.createdAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      {record.milestone && (
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                          Milestone
                        </span>
                      )}
                    </div>
                    {renderTrainingContent(record)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-600">No training data available for this agent.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}