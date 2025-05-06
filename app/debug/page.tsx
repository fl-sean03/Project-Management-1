'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

export default function DebugPage() {
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [clientProjects, setClientProjects] = useState<any>(null);
  const [serverProjects, setServerProjects] = useState<any>(null);
  const [clientError, setClientError] = useState<any>(null);
  const [serverError, setServerError] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  useEffect(() => {
    // Get environment variables
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    setSupabaseUrl(url || 'Not defined');
    setSupabaseKey(key ? 'Defined (hidden for security)' : 'Not defined');
    
    const fetchData = async () => {
      setLoading(true);
      
      // Client-side fetch (subject to RLS)
      try {
        if (url && key) {
          const supabase = createClient(url, key);
          const { data, error } = await supabase.from('projects').select('*');
          
          if (error) {
            setClientError(error);
          } else {
            setClientProjects(data);
            // Check for missing fields
            if (data && data.length > 0) {
              const expectedFields = [
                'id', 'name', 'description', 'status', 'progress', 
                'due_date', 'team', 'priority', 'created_at'
              ];
              
              const missing = expectedFields.filter(field => 
                !data[0].hasOwnProperty(field) || data[0][field] === null
              );
              
              setMissingFields(missing);
            }
          }
        }
      } catch (err) {
        setClientError(err);
      }
      
      // Server-side fetch (bypasses RLS)
      try {
        const response = await fetch('/api/projects');
        if (!response.ok) {
          setServerError(`HTTP error! status: ${response.status}`);
        } else {
          const result = await response.json();
          setServerProjects(result.data);
        }
      } catch (err) {
        setServerError(err);
      }
      
      setLoading(false);
    };
    
    fetchData();
  }, []);

  // Function to manually fetch data again
  const handleRefetch = async () => {
    setLoading(true);
    setClientError(null);
    setServerError(null);
    setClientProjects(null);
    setServerProjects(null);
    
    // Client-side fetch
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (url && key) {
        const supabase = createClient(url, key);
        const { data, error } = await supabase
          .from('projects')
          .select('id, name, description, status, progress, team, created_at');
        
        if (error) {
          setClientError(error);
        } else {
          setClientProjects(data);
        }
      }
    } catch (err) {
      setClientError(err);
    }
    
    // Server-side fetch
    try {
      const response = await fetch('/api/projects');
      if (!response.ok) {
        setServerError(`HTTP error! status: ${response.status}`);
      } else {
        const result = await response.json();
        setServerProjects(result.data);
      }
    } catch (err) {
      setServerError(err);
    }
    
    setLoading(false);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Supabase Debug Info</h1>
      
      <div className="bg-gray-100 p-4 rounded mb-6">
        <h2 className="text-xl font-semibold mb-2">Environment Variables</h2>
        <p><strong>NEXT_PUBLIC_SUPABASE_URL:</strong> {supabaseUrl}</p>
        <p><strong>NEXT_PUBLIC_SUPABASE_ANON_KEY:</strong> {supabaseKey}</p>
      </div>
      
      <button 
        onClick={handleRefetch}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
      >
        Refetch All Data
      </button>
      
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="space-y-6">
          {/* Client-side fetch results */}
          <div className="bg-gray-100 p-4 rounded">
            <h2 className="text-xl font-semibold mb-2">Client-side Projects (with RLS)</h2>
            
            {clientError ? (
              <div className="bg-red-100 text-red-700 p-4 rounded">
                <h3 className="font-bold">Error:</h3>
                <pre className="mt-2">{JSON.stringify(clientError, null, 2)}</pre>
              </div>
            ) : (
              <div>
                <p>Total projects: {clientProjects?.length || 0}</p>
                
                {missingFields.length > 0 && (
                  <div className="bg-yellow-100 text-yellow-800 p-4 mt-2 rounded">
                    <h3 className="font-bold">Missing or null fields:</h3>
                    <ul className="list-disc pl-5 mt-2">
                      {missingFields.map(field => (
                        <li key={field}>{field}</li>
                      ))}
                    </ul>
                    <p className="mt-2">These fields are expected by the UI but are missing in the data.</p>
                  </div>
                )}
                
                <div className="mt-4">
                  <h3 className="font-semibold">Raw Data:</h3>
                  <pre className="bg-gray-200 p-2 rounded mt-2 text-sm overflow-auto max-h-60">
                    {JSON.stringify(clientProjects, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
          
          {/* Server-side fetch results */}
          <div className="bg-gray-100 p-4 rounded">
            <h2 className="text-xl font-semibold mb-2">Server-side Projects (bypasses RLS)</h2>
            
            {serverError ? (
              <div className="bg-red-100 text-red-700 p-4 rounded">
                <h3 className="font-bold">Error:</h3>
                <pre className="mt-2">{JSON.stringify(serverError, null, 2)}</pre>
              </div>
            ) : (
              <div>
                <p>Total projects: {serverProjects?.length || 0}</p>
                
                <div className="mt-4">
                  <h3 className="font-semibold">Raw Data:</h3>
                  <pre className="bg-gray-200 p-2 rounded mt-2 text-sm overflow-auto max-h-60">
                    {JSON.stringify(serverProjects, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 