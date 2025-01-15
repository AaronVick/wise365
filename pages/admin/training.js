// /pages/admin/training.js

// Section 1: Imports and Initial State Setup
import { useEffect, useState, useCallback } from 'react'; // Added useCallback for memoization
import PropTypes from 'prop-types';
import dynamic from 'next/dynamic';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

// Define PropTypes for the component
const trainingDataPropTypes = {
  id: PropTypes.string.isRequired,
  description: PropTypes.string,
  URL: PropTypes.string,
  milestone: PropTypes.bool,
  details: PropTypes.arrayOf(PropTypes.string),
  traits: PropTypes.arrayOf(PropTypes.string),
  tone: PropTypes.string,
  datatype: PropTypes.string.isRequired,

  const [selectedLLM, setSelectedLLM] = useState('');
  const LLM_OPTIONS = [
    { value: 'gpt-4', label: 'GPT-4' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
    { value: 'claude-3-opus', label: 'Claude 3 Opus' },
    { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet' },
    { value: 'claude-3-haiku', label: 'Claude 3 Haiku' }
  ];


// Main Training Component
export default function Training() {
  // Core data states
  const [data, setData] = useState({});  // Changed to object for better key-based access
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form and data management states
  const [dataTypeOptions, setDataTypeOptions] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [newKnowledge, setNewKnowledge] = useState({
    dataType: '',
    fields: {},
  });

  // Constants for data types and their fields
  const DATA_TYPE_FIELDS = {
    instructions: ['title', 'details', 'priority'],
    personality: ['tone', 'traits', 'description'],
    milestone: ['title', 'description', 'date', 'impact'],
    knowledge: ['category', 'content', 'source']
  };

  Training.propTypes = {
    initialAgents: PropTypes.arrayOf(PropTypes.shape({
      agentId: PropTypes.string.isRequired,
      agentName: PropTypes.string.isRequired,
      role: PropTypes.string.isRequired
    })),
    onError: PropTypes.func
  };

  
    // Section 2: Fetching Agents from Database
useEffect(() => {
  let isSubscribed = true;
  
  const fetchAgents = async () => {
    if (!isSubscribed) return;
    
    setLoading(true);
    setError(null);

    try {
      // Fetch agents from the agents table
      const response = await fetch('/api/admin/agents', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const agentsData = await response.json();
      
      // Ensure we have an array of agents
      if (!Array.isArray(agentsData?.agents)) {
        throw new Error('Invalid data format: Expected an array of agents');
      }

      // Validate and format agent data
      const validatedAgents = agentsData.agents
        .filter(agent => (
          agent?.id && 
          agent?.name && 
          agent?.role && 
          typeof agent.id === 'string' && 
          typeof agent.name === 'string' && 
          typeof agent.role === 'string'
        ))
        .map(agent => ({
          agentId: agent.id,
          agentName: agent.name,
          role: agent.role,
          isActive: agent.isActive ?? true
        }))
        .filter(agent => agent.isActive); // Only show active agents

      if (isSubscribed) {
        setAgents(validatedAgents);
        console.debug('Fetched agents:', validatedAgents.length);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
      if (isSubscribed) {
        setError('Failed to load agents. Please try again.');
        setAgents([]);
      }
    } finally {
      if (isSubscribed) {
        setLoading(false);
      }
    }
  };

  fetchAgents();
  return () => { isSubscribed = false; };
}, []);

// Section 3: Agent Selection and Training Data Fetch
const handleAgentSelection = async (agentId) => {
  if (!agentId) return;
  
  setSelectedAgent(agentId);
  setLoading(true);
  setError(null);
  setSelectedLLM(''); // Reset LLM selection when agent changes

  try {
    // Fetch training data for the selected agent from agentData table
    const response = await fetch(`/api/admin/training/${agentId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch training data');
    }

    const trainingData = await response.json();
    
    if (!Array.isArray(trainingData?.records)) {
      throw new Error('Invalid training data format');
    }

    // Generate data type options for the form
    const dynamicOptions = generateDataTypeOptions(trainingData.records);
    setDataTypeOptions(dynamicOptions);

    // Aggregate data by type for display
    const aggregatedData = aggregateDataByType(trainingData.records);
    setData(aggregatedData);

    // If this agent has no training data, show a message
    if (Object.keys(aggregatedData).length === 0) {
      setError('No training data available for this agent. Use the LLM generator to create initial training data.');
    }

  } catch (error) {
    console.error('Error fetching training data:', error);
    setError('Failed to load training data. Please try again.');
    setData({});
  } finally {
    setLoading(false);
  }
};

const generateDataTypeOptions = (records) => {
  const dataTypes = new Set();
  
  // Add predefined types first
  Object.keys(DATA_TYPE_FIELDS).forEach(type => dataTypes.add(type));
  
  // Add any additional types from existing records
  records.forEach(record => {
    if (record.datatype) {
      dataTypes.add(record.datatype);
    }
  });

  return Array.from(dataTypes).map(type => ({
    value: type,
    label: type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
  }));
};

const aggregateDataByType = (records) => {
  return records.reduce((acc, record) => {
    const { datatype } = record;
    if (!acc[datatype]) {
      acc[datatype] = [];
    }

    
    // Sort records by date if available
    acc[datatype].push(record);
    acc[datatype].sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      return 0;
    });
    
    return acc;
  }, {});
};


const handleGenerateContent = async () => {
  if (!selectedAgent || !selectedLLM) {
    setError('Please select both an agent and an LLM model');
    return;
  }

  setLoading(true);
  try {
    const response = await fetch('/api/admin/generate-training', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agentId: selectedAgent,
        model: selectedLLM
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate training content');
    }

    const result = await response.json();
    // Refresh the training data after generation
    await handleAgentSelection(selectedAgent);
    setError(null);
  } catch (error) {
    console.error('Error generating content:', error);
    setError('Failed to generate training content. Please try again.');
  } finally {
    setLoading(false);
  }
};


// Section 4: Displaying Aggregated Data

const renderAggregatedData = () => {
  if (!selectedAgent) {
    return (
      <p className="text-gray-600">Select an agent to view their training data.</p>
    );
  }

  if (!Object.keys(data).length) {
    return (
      <p className="text-gray-600">No training data available for the selected agent.</p>
    );
  }

  return (
    <div>
      {Object.entries(data).map(([dataType, records]) => (
        <div key={dataType} className="mb-6">
          <h3 className="text-lg font-bold mb-2">
            {dataType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {records.map((record) => (
              <Card key={record.id} className="bg-white shadow rounded border border-gray-200">
                <CardHeader>
                  <h4 className="font-bold">
                    {record.description || 'No Description Available'}
                  </h4>
                </CardHeader>
                <CardContent>
                  {record.URL && (
                    <a
                      href={record.URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-700"
                    >
                      Learn More
                    </a>
                  )}

                  <div className="mt-2">
                    {record.milestone && (
                      <p className="text-green-600 font-semibold">Milestone</p>
                    )}

                    {record.details &&
                      Array.isArray(record.details) &&
                      record.details.map((detail, index) => (
                        <p key={index} className="text-sm mt-1">
                          - {detail}
                        </p>
                      ))}

                    <div className="mt-2 flex flex-wrap gap-2">
                      {record.traits &&
                        Array.isArray(record.traits) &&
                        record.traits.map((trait, index) => (
                          <span
                            key={index}
                            className="inline-block bg-gray-100 text-sm text-gray-800 px-2 py-1 rounded"
                          >
                            {trait}
                          </span>
                        ))}
                    </div>

                    {record.tone && (
                      <p className="mt-2 italic text-gray-600">Tone: {record.tone}</p>
                    )}
                  </div>

                  <div className="mt-4 flex justify-end">
                    <Button
                      onClick={() => setEditingItem(record)}
                      className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                    >
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// Section 5: Adding New Records

const renderAddKnowledgeForm = () => {
  const [newRecord, setNewRecord] = useState({ dataType: '', fields: {} });

  const handleDataTypeChange = (event) => {
    const selectedType = event.target.value;
    setNewRecord({
      dataType: selectedType,
      fields: {},
    });
  };

  const handleFieldChange = (field, value) => {
    setNewRecord((prev) => ({
      ...prev,
      fields: {
        ...prev.fields,
        [field]: value,
      },
    }));
  };

  const handleAddRecord = async () => {
    if (!newRecord.dataType || !Object.keys(newRecord.fields).length) {
      setError('Please complete all required fields.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin?tab=addRecord&agentId=${selectedAgent}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newRecord),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add the record');
      }

      // Reset form and refresh data
      setNewRecord({ dataType: '', fields: {} });
      await handleAgentSelection(selectedAgent);
      setError(null);
    } catch (error) {
      console.error('Error adding record:', error);
      setError(error.message || 'Failed to add the record. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderDynamicFields = () => {
    if (!newRecord.dataType) {
      return <p className="text-gray-600">Select a data type to see available fields.</p>;
    }

    const fields = DATA_TYPE_FIELDS[newRecord.dataType] || [];

    if (!fields.length) {
      return <p className="text-gray-600">No predefined fields available for this data type.</p>;
    }

    return fields.map((field) => (
      <div key={field} className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {field.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
        </label>
        <Input
          type="text"
          value={newRecord.fields[field] || ''}
          onChange={(e) => handleFieldChange(field, e.target.value)}
          className="w-full"
        />
      </div>
    ));
  };

  return (
    <div className="mt-6 bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-bold mb-4">Add New Record</h3>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Data Type</label>
        <Select
          value={newRecord.dataType}
          onChange={handleDataTypeChange}
          className="w-full"
        >
          <option value="" disabled>Select a Data Type</option>
          {dataTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      {renderDynamicFields()}

      <div className="mt-6">
        <Button
          onClick={handleAddRecord}
          className="w-full bg-blue-500 text-white disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Adding...' : 'Add Record'}
        </Button>
      </div>
    </div>
  );
};

// Section 6: Editing Existing Records

const renderEditModal = () => {
  const [editedRecord, setEditedRecord] = useState(null);

  useEffect(() => {
    if (editingItem) {
      setEditedRecord({ ...editingItem });
    }
  }, [editingItem]);

  const handleFieldChange = (field, value) => {
    setEditedRecord((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveChanges = async () => {
    if (!editedRecord) {
      setError('No changes to save.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin?tab=editRecord&agentId=${selectedAgent}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedRecord),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update the record');
      }

      setEditingItem(null);
      await handleAgentSelection(selectedAgent);
      setError(null);
    } catch (error) {
      console.error('Error updating record:', error);
      setError(error.message || 'Failed to update the record. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderDynamicFields = () => {
    if (!editedRecord) return null;

    const fields = Object.keys(editedRecord).filter(
      (key) => !['id', 'agentId', 'dataType', 'createdAt', 'updatedAt'].includes(key)
    );

    return fields.map((field) => (
      <div key={field} className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {field.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
        </label>
        {Array.isArray(editedRecord[field]) ? (
          <div className="space-y-2">
            {editedRecord[field].map((item, index) => (
              <Input
                key={index}
                type="text"
                value={item}
                onChange={(e) => {
                  const updatedArray = [...editedRecord[field]];
                  updatedArray[index] = e.target.value;
                  handleFieldChange(field, updatedArray);
                }}
                className="w-full"
              />
            ))}
            <Button
              onClick={() => {
                const updatedArray = [...editedRecord[field], ''];
                handleFieldChange(field, updatedArray);
              }}
              className="text-sm bg-gray-100 hover:bg-gray-200"
            >
              Add Item
            </Button>
          </div>
        ) : (
          <Input
            type="text"
            value={editedRecord[field] || ''}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            className="w-full"
          />
        )}
      </div>
    ));
  };

  return (
    <div className={`fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center ${
      editingItem ? 'visible' : 'hidden'
    }`}>
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Edit Record</h3>
          <Button
            onClick={() => setEditingItem(null)}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </Button>
        </div>

        <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
          {renderDynamicFields()}
        </div>

        <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
          <Button
            onClick={() => setEditingItem(null)}
            className="bg-gray-100 hover:bg-gray-200"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveChanges}
            className="bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
};

// Section 7: Final Component Render

return (
  <div className="p-6">
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-2xl font-bold">Agent Training Data</h2>
      {selectedAgent && (
        <Button
          onClick={() => handleGenerateContent()}
          disabled={!selectedLLM || loading}
          className="bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
        >
          Generate Training Content
        </Button>
      )}
    </div>

    {error && (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        {error}
      </div>
    )}

    {renderAgentSelection()}

    {loading && (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
      </div>
    )}

    {!loading && selectedAgent && (
      <>
        {renderAggregatedData()}
        {renderAddKnowledgeForm()}
        {editingItem && renderEditModal()}
      </>
    )}
  </div>
);

} // End of Training component export default Training;