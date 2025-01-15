//  /pages/admin/training.js

// Section 1: Imports and Initial Setup
import { useEffect, useState } from 'react';

export default function Training() {
  // State declarations
  const [data, setData] = useState([]);
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dataTypeOptions, setDataTypeOptions] = useState([]);
  const [editingItem, setEditingItem] = useState(null);

  // Dynamically determine data types and their options
  const generateDataTypeOptions = (records) => {
    const dataTypes = new Set();
    records.forEach((record) => {
      if (record.dataType) {
        dataTypes.add(record.dataType);
      }
    });
    return Array.from(dataTypes).map((type) => ({
      value: type,
      label: type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    }));
  };

  // Aggregate data types dynamically based on fetched data
  const aggregateDataByType = (records) => {
    return records.reduce((acc, record) => {
      const { dataType } = record;
      if (!acc[dataType]) {
        acc[dataType] = [];
      }
      acc[dataType].push(record);
      return acc;
    }, {});
  };
}


// Section 2: Fetching Agents and Dynamic Options Generation

// Fetch agents on component mount
useEffect(() => {
  async function fetchAgents() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin?tab=agents');
      if (!res.ok) throw new Error('Failed to fetch agents');
      const agentsData = await res.json();
      setAgents(agentsData || []);
    } catch (error) {
      console.error('Error fetching agents:', error);
      setError(error.message);
      setAgents([]);
    } finally {
      setLoading(false);
    }
  }
  fetchAgents();
}, []);

// Fetch agent-specific data
const handleAgentSelection = async (agentId) => {
  setSelectedAgent(agentId);
  setLoading(true);
  setError(null);

  try {
    const res = await fetch(`/api/admin?tab=training&agentId=${agentId}`);
    if (!res.ok) throw new Error('Failed to fetch training data');
    const trainingData = await res.json();

    // Dynamically generate data type options based on fetched data
    const dynamicOptions = generateDataTypeOptions(trainingData);
    setDataTypeOptions(dynamicOptions);

    // Aggregate data by type for display
    const aggregatedData = aggregateDataByType(trainingData);
    setData(aggregatedData || []);
  } catch (error) {
    console.error('Error fetching training data:', error);
    setError(error.message);
    setData([]);
  } finally {
    setLoading(false);
  }
};


// Section 3: Rendering UI (Initial Layout and Agent Selection)

return (
  <div className="p-6">
    <h2 className="text-xl font-bold mb-4">Agent Training Data</h2>

    {/* Display error if any */}
    {error && (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        {error}
      </div>
    )}

    {/* Display loading spinner */}
    {loading && (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
      </div>
    )}

    {/* Agent selection dropdown */}
    <select
      className="p-2 border rounded w-full mb-4"
      value={selectedAgent || ''}
      onChange={(e) => handleAgentSelection(e.target.value)}
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
  </div>
);


// Section 4: Rendering Aggregated Data

{selectedAgent && Object.keys(aggregatedData).length > 0 ? (
  <div>
    {Object.entries(aggregatedData).map(([dataType, records]) => (
      <div key={dataType} className="mb-6">
        <h3 className="text-lg font-bold mb-2">
          {dataTypeLabels[dataType] || `Data Type: ${dataType}`}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {records.map((record) => (
            <div key={record.id} className="p-4 bg-gray-100 shadow rounded">
              <h4 className="font-bold">{record.description || 'No Description'}</h4>
              {record.URL && (
                <a
                  href={record.URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500"
                >
                  Learn More
                </a>
              )}
              <div className="mt-2">
                {record.milestone && (
                  <p className="text-green-600 font-semibold">Milestone</p>
                )}
                {record.data &&
                  Object.entries(record.data).map(([key, value]) => (
                    <p key={key}>
                      <strong>{key}:</strong>{' '}
                      {Array.isArray(value) ? value.join(', ') : value}
                    </p>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
) : (
  <p className="text-gray-600">
    {selectedAgent
      ? 'No training data available for this agent.'
      : 'Select an agent to view training data.'}
  </p>
)}


{/* Section 5: Add/Edit Modal */}
{editingItem && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <h3 className="text-lg font-bold mb-4">Edit {editingItem.dataType}</h3>

      {/* Base fields for all types */}
      <textarea
        className="p-2 border rounded w-full mb-2"
        placeholder="Description"
        value={editingItem.description || ''}
        onChange={(e) =>
          setEditingItem({
            ...editingItem,
            description: e.target.value,
          })
        }
      />

      <input
        type="text"
        className="p-2 border rounded w-full mb-2"
        placeholder="URL (Optional)"
        value={editingItem.URL || ''}
        onChange={(e) =>
          setEditingItem({
            ...editingItem,
            URL: e.target.value,
          })
        }
      />

      <div className="mb-2">
        <label className="mr-2 font-bold">Milestone:</label>
        <input
          type="checkbox"
          checked={editingItem.milestone || false}
          onChange={(e) =>
            setEditingItem({
              ...editingItem,
              milestone: e.target.checked,
            })
          }
        />
      </div>

      {/* Dynamic fields based on dataType */}
      {editingItem.data &&
        Object.entries(editingItem.data).map(([key, value]) => {
          if (Array.isArray(value)) {
            return (
              <div key={key} className="mb-4">
                <label className="block font-bold mb-2">{key}</label>
                {value.map((item, idx) => (
                  <div key={idx} className="flex items-center mb-2">
                    <input
                      type="text"
                      className="p-2 border rounded flex-1 mr-2"
                      value={item}
                      onChange={(e) => {
                        const newArray = [...value];
                        newArray[idx] = e.target.value;
                        setEditingItem({
                          ...editingItem,
                          data: { ...editingItem.data, [key]: newArray },
                        });
                      }}
                    />
                    <button
                      className="px-2 py-1 bg-red-500 text-white rounded"
                      onClick={() => {
                        const newArray = [...value];
                        newArray.splice(idx, 1);
                        setEditingItem({
                          ...editingItem,
                          data: { ...editingItem.data, [key]: newArray },
                        });
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  className="px-2 py-1 bg-blue-500 text-white rounded"
                  onClick={() => {
                    const newArray = [...value, ''];
                    setEditingItem({
                      ...editingItem,
                      data: { ...editingItem.data, [key]: newArray },
                    });
                  }}
                >
                  + Add Item
                </button>
              </div>
            );
          }
          if (typeof value === 'string') {
            return (
              <textarea
                key={key}
                className="p-2 border rounded w-full mb-2"
                placeholder={key}
                value={value}
                onChange={(e) =>
                  setEditingItem({
                    ...editingItem,
                    data: { ...editingItem.data, [key]: e.target.value },
                  })
                }
              />
            );
          }
          return null;
        })}

      <div className="flex justify-end gap-2 mt-4">
        <button
          onClick={() => setEditingItem(null)}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Cancel
        </button>
        <button
          onClick={async () => {
            try {
              const res = await fetch(`/api/admin/training/${editingItem.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingItem),
              });
              if (!res.ok) throw new Error('Failed to update item');
              alert('Item updated successfully!');
              setEditingItem(null);
              handleAgentSelection(selectedAgent); // Refresh data
            } catch (error) {
              alert('Error updating item: ' + error.message);
            }
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Save Changes
        </button>
      </div>
    </div>
  </div>
)}


// Section 6: Add New Knowledge Form

{selectedAgent && !loading && (
  <div className="p-4 bg-white shadow rounded mt-6">
    <h3 className="text-lg font-bold mb-2">Add New Knowledge</h3>

    {/* Dynamic dataType dropdown based on options */}
    <select
      className="p-2 border rounded w-full mb-2"
      value={newKnowledge.dataType || ''}
      onChange={(e) =>
        setNewKnowledge({
          ...newKnowledge,
          dataType: e.target.value,
        })
      }
    >
      {dataTypeOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>

    {/* Description field */}
    <textarea
      className="p-2 border rounded w-full mb-2"
      placeholder="Description"
      value={newKnowledge.description || ''}
      onChange={(e) =>
        setNewKnowledge({
          ...newKnowledge,
          description: e.target.value,
        })
      }
    />

    {/* URL field */}
    <input
      type="text"
      className="p-2 border rounded w-full mb-2"
      placeholder="URL (Optional)"
      value={newKnowledge.URL || ''}
      onChange={(e) =>
        setNewKnowledge({
          ...newKnowledge,
          URL: e.target.value,
        })
      }
    />

    {/* Milestone toggle */}
    <div className="mb-2">
      <label className="mr-2 font-bold">Milestone:</label>
      <input
        type="checkbox"
        checked={newKnowledge.milestone || false}
        onChange={(e) =>
          setNewKnowledge({
            ...newKnowledge,
            milestone: e.target.checked,
          })
        }
      />
    </div>

    {/* Dynamic fields for data type */}
    {newKnowledge.data &&
      Object.entries(newKnowledge.data).map(([key, value]) => {
        if (Array.isArray(value)) {
          return (
            <div key={key} className="mb-4">
              <label className="block font-bold mb-2">{key}</label>
              {value.map((item, idx) => (
                <div key={idx} className="flex items-center mb-2">
                  <input
                    type="text"
                    className="p-2 border rounded flex-1 mr-2"
                    value={item}
                    onChange={(e) => {
                      const newArray = [...value];
                      newArray[idx] = e.target.value;
                      setNewKnowledge({
                        ...newKnowledge,
                        data: { ...newKnowledge.data, [key]: newArray },
                      });
                    }}
                  />
                  <button
                    className="px-2 py-1 bg-red-500 text-white rounded"
                    onClick={() => {
                      const newArray = [...value];
                      newArray.splice(idx, 1);
                      setNewKnowledge({
                        ...newKnowledge,
                        data: { ...newKnowledge.data, [key]: newArray },
                      });
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                className="px-2 py-1 bg-blue-500 text-white rounded"
                onClick={() => {
                  const newArray = [...value, ''];
                  setNewKnowledge({
                    ...newKnowledge,
                    data: { ...newKnowledge.data, [key]: newArray },
                  });
                }}
              >
                + Add Item
              </button>
            </div>
          );
        }
        if (typeof value === 'string') {
          return (
            <textarea
              key={key}
              className="p-2 border rounded w-full mb-2"
              placeholder={key}
              value={value}
              onChange={(e) =>
                setNewKnowledge({
                  ...newKnowledge,
                  data: { ...newKnowledge.data, [key]: e.target.value },
                })
              }
            />
          );
        }
        return null;
      })}

    {/* Submit button */}
    <button
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
      onClick={async () => {
        try {
          const res = await fetch('/api/admin/training', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newKnowledge),
          });
          if (!res.ok) throw new Error('Failed to add knowledge');
          alert('Knowledge added successfully!');
          setNewKnowledge({
            ...newKnowledge,
            description: '',
            URL: '',
            data: {},
          });
          handleAgentSelection(selectedAgent); // Refresh data
        } catch (error) {
          alert('Error adding knowledge: ' + error.message);
        }
      }}
      disabled={loading}
    >
      Add Knowledge
    </button>
  </div>
)}


// Section 7: Utility Functions and Final Component Return

// Utility function to reset new knowledge template
const resetNewKnowledge = () => {
  setNewKnowledge({
    dataType: '',
    description: '',
    URL: '',
    milestone: false,
    data: {},
  });
};

// Final Component Return
return (
  <div className="p-6">
    <h2 className="text-xl font-bold mb-4">Agent Training Data</h2>

    {/* Error Notification */}
    {error && (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        {error}
      </div>
    )}

    {/* Loading Spinner */}
    {loading && (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
      </div>
    )}

    {/* Agent Selection Dropdown */}
    <select
      className="p-2 border rounded w-full mb-4"
      value={selectedAgent || ''}
      onChange={(e) => handleAgentSelection(e.target.value)}
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

    {/* Aggregated Data Display */}
    {selectedAgent && Object.keys(data).length > 0 ? (
      <div>
        {Object.entries(data).map(([dataType, records]) => (
          <div key={dataType} className="mb-6">
            <h3 className="text-lg font-bold mb-2">{dataType}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {records.map((record) => (
                <div key={record.id} className="p-4 bg-gray-100 shadow rounded">
                  <h4 className="font-bold">{record.description || 'No Description'}</h4>
                  {record.URL && (
                    <a
                      href={record.URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500"
                    >
                      Learn More
                    </a>
                  )}
                  <div className="mt-2">
                    {record.milestone && (
                      <p className="text-green-600 font-semibold">Milestone</p>
                    )}
                    {record.data &&
                      Object.entries(record.data).map(([key, value]) => (
                        <p key={key}>
                          <strong>{key}:</strong>{' '}
                          {Array.isArray(value) ? value.join(', ') : value}
                        </p>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    ) : (
      <p className="text-gray-600">
        {selectedAgent
          ? 'No training data available for this agent.'
          : 'Select an agent to view training data.'}
      </p>
    )}

    {/* Add New Knowledge Form */}
    {selectedAgent && !loading && (
      <div className="mt-6">
        <h3 className="text-lg font-bold mb-4">Add New Knowledge</h3>
        {renderAddKnowledgeForm()}
      </div>
    )}

    {/* Edit Modal */}
    {editingItem && renderEditModal()}
  </div>
);
}
