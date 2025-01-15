// pages/admin/training.js
// Section 1: Agent Selection

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

export default function Training() {
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [error, setError] = useState(null);
  const [trainingData, setTrainingData] = useState([]);
  const [loadingTrainingData, setLoadingTrainingData] = useState(false);

  // Fetch agents from Firestore
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'agents'));
        const agentList = querySnapshot.docs.map((doc) => ({
          agentId: doc.get('agentId') || doc.id,
          agentName: doc.get('agentName') || 'Unnamed Agent',
          role: doc.get('Role') || 'No Role',
        }));
        setAgents(agentList);
      } catch (err) {
        console.error('Error fetching agents:', err);
        setError('Failed to load agents.');
      }
    };

    fetchAgents();
  }, []);

  // Render agent selection dropdown
  const renderAgentSelection = () => (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Select Agent
      </label>
      <select
        value={selectedAgent || ''}
        onChange={(e) => setSelectedAgent(e.target.value)}
        className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        disabled={agents.length === 0}
      >
        <option value="" disabled>
          {agents.length === 0 ? 'Loading agents...' : 'Select an Agent'}
        </option>
        {agents.map((agent) => (
          <option key={agent.agentId} value={agent.agentId}>
            {agent.agentName}: {agent.role}
          </option>
        ))}
      </select>
      {selectedAgent && (
        <p className="mt-2 text-sm text-gray-500">
          Selected Agent ID: {selectedAgent}
        </p>
      )}
    </div>
  );

    // Section 2: Fetching and Displaying Training Data

    useEffect(() => {
      if (!selectedAgent) return;
  
      const fetchTrainingData = async () => {
        setLoadingTrainingData(true);
        try {
          const querySnapshot = await getDocs(
            query(collection(db, 'agentData'), where('agentId', '==', selectedAgent))
          );
          const records = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setTrainingData(records);
        } catch (err) {
          console.error('Error fetching training data:', err);
          setError('Failed to load training data.');
        } finally {
          setLoadingTrainingData(false);
        }
      };
  
      fetchTrainingData();
    }, [selectedAgent]);
  
    const renderTrainingData = () => {
      if (loadingTrainingData) {
        return (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p>Loading training data...</p>
          </div>
        );
      }
  
      if (trainingData.length === 0) {
        return <p className="text-gray-600">No training data available for this agent.</p>;
      }
  
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {trainingData.map((record) => (
            <div key={record.id} className="bg-white shadow rounded border border-gray-200 p-4">
              <h3 className="text-lg font-bold mb-2">{record.datatype || 'Unknown Type'}</h3>
              <p className="text-sm text-gray-600 mb-2">{record.description || 'No description available.'}</p>
              {record.details && Array.isArray(record.details) && (
                <ul className="list-disc list-inside text-sm text-gray-600">
                  {record.details.map((detail, idx) => (
                    <li key={idx}>{detail}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      );
    };

    


  // Section 3: Adding New Training Data

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [availableDataTypes, setAvailableDataTypes] = useState([]);
  const [selectedDataType, setSelectedDataType] = useState('');
  const [dynamicFields, setDynamicFields] = useState([]);
  const [newRecordFields, setNewRecordFields] = useState({});
  const [saving, setSaving] = useState(false);

  // Aggregate data types and fields from agentData
  useEffect(() => {
    const aggregateDataTypes = () => {
      const dataTypeMap = {};

      trainingData.forEach((record) => {
        const { datatype, ...fields } = record;

        if (!dataTypeMap[datatype]) {
          dataTypeMap[datatype] = new Set();
        }

        Object.keys(fields).forEach((field) => dataTypeMap[datatype].add(field));
      });

      const aggregatedDataTypes = Object.entries(dataTypeMap).map(([type, fields]) => ({
        type,
        fields: Array.from(fields),
      }));

      setAvailableDataTypes(aggregatedDataTypes);
    };

    if (trainingData.length > 0) {
      aggregateDataTypes();
    }
  }, [trainingData]);

  const handleDataTypeSelection = (event) => {
    const selectedType = event.target.value;
    setSelectedDataType(selectedType);

    const selectedTypeFields = availableDataTypes.find((type) => type.type === selectedType)?.fields || [];
    setDynamicFields(selectedTypeFields);

    // Reset fields for the new record
    setNewRecordFields({});
  };

  const handleFieldChange = (field, value) => {
    setNewRecordFields((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveRecord = async () => {
    if (!selectedAgent || !selectedDataType) {
      setError('Please select an agent and a data type.');
      return;
    }

    setSaving(true);
    try {
      const newRecord = {
        agentId: selectedAgent,
        datatype: selectedDataType,
        ...newRecordFields,
      };

      const docRef = collection(db, 'agentData');
      await docRef.add(newRecord);

      // Refresh training data after saving
      setTrainingData((prev) => [...prev, newRecord]);
      setIsFormOpen(false);
      setError(null);
    } catch (err) {
      console.error('Error saving new record:', err);
      setError('Failed to save new record.');
    } finally {
      setSaving(false);
    }
  };

  const renderAddForm = () => {
    if (!isFormOpen) return null;

    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-bold mb-4">Add New Training Data</h3>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Data Type</label>
          <select
            value={selectedDataType}
            onChange={handleDataTypeSelection}
            className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm"
          >
            <option value="" disabled>
              Select a Data Type
            </option>
            {availableDataTypes.map(({ type }) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {dynamicFields.length > 0 && (
          <div>
            {dynamicFields.map((field) => (
              <div key={field} className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">{field}</label>
                <input
                  type="text"
                  value={newRecordFields[field] || ''}
                  onChange={(e) => handleFieldChange(field, e.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm"
                />
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={() => setIsFormOpen(false)}
            className="px-4 py-2 bg-gray-200 rounded shadow"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveRecord}
            className="px-4 py-2 bg-blue-500 text-white rounded shadow"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    );
  };

  const renderAddButton = () => (
    <button
      onClick={() => setIsFormOpen(true)}
      className="px-4 py-2 bg-green-500 text-white rounded shadow mb-6"
    >
      Add New Training Data
    </button>
  );


    // Final Render Section

    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Agent Training Data</h2>
  
        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
  
        {/* Agent Selection Dropdown */}
        {renderAgentSelection()}
  
        {/* Training Data Display */}
        {selectedAgent && (
          <>
            <div className="mt-6">
              <h3 className="text-xl font-semibold mb-4">Training Data</h3>
              {renderTrainingData()}
            </div>
  
            {/* Add New Training Data */}
            <div className="mt-6">
              {renderAddButton()}
              {renderAddForm()}
            </div>
          </>
        )}
      </div>
    );
  }
  
