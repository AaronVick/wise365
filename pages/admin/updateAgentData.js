import { useState } from "react";

export default function UpdateAgentDataPage() {
  const [status, setStatus] = useState("Ready to update records.");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalProcessed, setTotalProcessed] = useState(0);

  const updateAgentDataRecords = async () => {
    setProcessing(true);
    setStatus("Starting update process...");
    setProgress(0);
    setTotalProcessed(0);

    try {
      let lastProcessedId = null;
      let hasMore = true;
      
      while (hasMore) {
        const response = await fetch('/api/updateAgentData', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            lastProcessedId,
            batchSize: 10,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'Unknown error occurred');
        }

        lastProcessedId = result.lastProcessedId;
        hasMore = result.hasMore;
        
        setTotalProcessed(prev => prev + result.updatedCount);
        setStatus(`Processed ${result.updatedCount} records in this batch. Total: ${totalProcessed + result.updatedCount}`);
        
        // Update progress (assuming we're processing roughly 1000 records total)
        setProgress(prev => Math.min(100, prev + (result.updatedCount / 10)));

        // Add a small delay to prevent overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      setStatus(`Complete! Updated ${totalProcessed} records successfully.`);
    } catch (error) {
      console.error("Error updating agentData records:", error);
      setStatus(`Error: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Update AgentData Records</h2>
      <button
        onClick={updateAgentDataRecords}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
        disabled={processing}
      >
        {processing ? "Processing..." : "Start Update"}
      </button>
      <p className="mt-4">{status}</p>
      <div className="mt-2">
        <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
          <div 
            className="bg-blue-500 h-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-600 mt-1">Progress: {Math.round(progress)}%</p>
      </div>
    </div>
  );
}