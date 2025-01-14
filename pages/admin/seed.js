// pages/admin/seed.js

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';

export default function SeedPage() {
  const [status, setStatus] = useState('');
  const [existingCount, setExistingCount] = useState(0);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [currentChunk, setCurrentChunk] = useState({ current: 0, total: 0 });
  const [totalRecords, setTotalRecords] = useState(0);
  const [processedRecords, setProcessedRecords] = useState(0);

  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState('');
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState('');

  // Fetch collections from Firebase
  useEffect(() => {
    const fetchCollections = async () => {
      console.log('Fetching Firebase collections...');
      try {
        const response = await fetch('/api/collections');
        const data = await response.json();
        setCollections(data.collections || []);
        setSelectedCollection(data.collections?.[0] || '');
        console.log('Fetched collections:', data.collections);
      } catch (err) {
        console.error('Error fetching collections:', err);
        setError('Failed to fetch Firebase collections.');
      }
    };

    fetchCollections();
  }, []);

  // Fetch available files dynamically
  useEffect(() => {
    const fetchFiles = async () => {
      if (!selectedCollection) return;

      console.log(`Fetching files for collection: ${selectedCollection}`);
      try {
        const response = await fetch(`/api/files?collection=${selectedCollection}`);
        const data = await response.json();
        setFiles(data.files || []);
        setSelectedFile(data.files?.[0] || '');
        console.log('Available files:', data.files);
      } catch (err) {
        console.error('Error fetching files:', err);
        setError('Failed to fetch files.');
      }
    };

    fetchFiles();
  }, [selectedCollection]);

  // Clean up EventSource on unmount
  useEffect(() => {
    return () => {
      if (window._eventSource) {
        console.log('Closing EventSource on component unmount.');
        window._eventSource.close();
      }
    };
  }, []);

  const handleSeed = async () => {
    if (!confirm(`Seed the database with ${selectedFile} for ${selectedCollection}? This action cannot be undone.`)) {
      console.log('Seeding operation cancelled by user.');
      return;
    }

    console.log('Starting seeding for:', { collection: selectedCollection, file: selectedFile });

    setStatus('Initializing...');
    setLoading(true);
    setError(null);
    setResults([]);
    setProgress(0);
    setCurrentChunk({ current: 0, total: 0 });
    setTotalRecords(0);
    setProcessedRecords(0);

    try {
      if (window._eventSource) {
        console.log('Closing any existing EventSource connection before starting.');
        window._eventSource.close();
      }

      const eventSource = new EventSource(`/api/seed?collection=${selectedCollection}&file=${selectedFile}`);
      window._eventSource = eventSource;

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('Event received:', data);

        switch (data.type) {
          case 'start':
            console.log('Seeding process started:', data);
            setTotalRecords(data.totalRecords);
            setStatus('Seeding process started.');
            break;

          case 'chunk-start':
            console.log(`Processing chunk ${data.currentChunk} of ${data.totalChunks}`);
            setCurrentChunk({ current: data.currentChunk, total: data.totalChunks });
            setStatus(data.message);
            break;

          case 'chunk-complete':
            console.log(`Chunk complete. Processed ${data.processedRecords}/${data.totalRecords}`);
            setProcessedRecords(data.processedRecords);
            setProgress((data.processedRecords / data.totalRecords) * 100);
            setResults((prevResults) => [...prevResults, ...data.chunkResults]);
            break;

          case 'complete':
            console.log('Seeding complete:', data);
            setProcessedRecords(data.totalProcessed);
            setProgress(100);
            setStatus('Seeding complete!');
            eventSource.close();
            setLoading(false);
            break;

          case 'error':
            console.error('Error during seeding:', data);
            setError(data.message);
            setStatus('Error occurred during seeding');
            eventSource.close();
            setLoading(false);
            break;

          default:
            console.warn('Unknown event type:', data.type);
            break;
        }
      };

      eventSource.onerror = (error) => {
        console.error('EventSource encountered an error:', error);
        setError('Connection error. Please try again.');
        setStatus('Failed');
        eventSource.close();
        setLoading(false);
      };
    } catch (error) {
      console.error('Error during seeding:', error);
      setError('An unexpected error occurred. Please try again.');
      setStatus('Failed');
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Database Seeding</h1>

        <div className="bg-white shadow rounded p-6">
          <p className="text-gray-600 mb-4">
            Select a collection and corresponding data file to seed the database.
          </p>

          <div className="mb-4">
            <label className="block mb-2 font-bold text-gray-700">Select Collection:</label>
            <select
              value={selectedCollection}
              onChange={(e) => setSelectedCollection(e.target.value)}
              className="w-full px-4 py-2 border rounded"
            >
              {collections.map((collection) => (
                <option key={collection} value={collection}>
                  {collection}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block mb-2 font-bold text-gray-700">Select File:</label>
            <select
              value={selectedFile}
              onChange={(e) => setSelectedFile(e.target.value)}
              className="w-full px-4 py-2 border rounded"
              disabled={!files.length}
            >
              {files.map((file) => (
                <option key={file} value={file}>
                  {file}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSeed}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-green-300"
            disabled={loading || !selectedFile}
          >
            {loading ? 'Seeding...' : 'Seed Database'}
          </button>

          {status && (
            <div className="mt-6">
              <h2 className="font-bold mb-2">Status: {status}</h2>

              {loading && (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>Overall Progress</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-green-500 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {currentChunk.total > 0 && (
                    <div className="text-sm text-gray-600">
                      Processing chunk {currentChunk.current} of {currentChunk.total}
                    </div>
                  )}

                  {totalRecords > 0 && (
                    <div className="text-sm text-gray-600">
                      Processed {processedRecords} of {totalRecords} records
                    </div>
                  )}
                </div>
              )}

              {existingCount > 0 && (
                <div className="text-sm text-gray-600">
                  Existing Records: {existingCount}
                </div>
              )}

              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}

              {results.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-bold mb-2">Results:</h3>
                  <div className="max-h-96 overflow-y-auto">
                    {results.map((result, index) => (
                      <div
                        key={index}
                        className={`p-2 mb-1 rounded ${
                          result.status === 'added' ? 'bg-green-100' :
                          result.status === 'skipped' ? 'bg-yellow-100' :
                          'bg-red-100'
                        }`}
                      >
                        <p className="text-sm">
                          {result.agentId} - {result.datatype}: {result.status}
                          {result.reason && ` (${result.reason})`}
                          {result.error && ` Error: ${result.error}`}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
