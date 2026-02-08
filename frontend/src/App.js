/**
 * Main App Component
 * 
 * Orchestrates the entire application:
 * - User input for GitHub repository
 * - Project execution
 * - Log streaming
 * - Error handling
 */

import React, { useState, useEffect } from 'react';
import RepositoryInput from './components/RepositoryInput';
import TerminalOutput from './components/TerminalOutput';
import { runProject, checkHealth } from './services/api';
import './App.css';

function App() {
  const [logs, setLogs] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState('');
  const [currentRepo, setCurrentRepo] = useState('');
  const [backendReady, setBackendReady] = useState(false);
  const [backendError, setBackendError] = useState('');

  // Check if backend is available on component mount
  useEffect(() => {
    const checkBackend = async () => {
      try {
        await checkHealth();
        setBackendReady(true);
        setBackendError('');
      } catch (err) {
        setBackendReady(false);
        setBackendError(err.message);
      }
    };

    checkBackend();
    // Retry every 5 seconds
    const interval = setInterval(checkBackend, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleRunProject = async (url, branch) => {
    if (!backendReady) {
      setError('Backend server is not available. Please start the backend.');
      return;
    }

    setIsRunning(true);
    setError('');
    setLogs([]);
    setCurrentRepo(url);

    try {
      await runProject(url, branch, (message) => {
        setLogs((prev) => [...prev, message]);
      });
      setIsRunning(false);
    } catch (err) {
      setError(err.message);
      setIsRunning(false);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>🚀 GitHub Project Runner</h1>
          <p>Execute any public GitHub repository remotely without downloading</p>
        </div>
        {!backendReady && (
          <div className="backend-warning">
            ⚠️ Backend not available: {backendError}
          </div>
        )}
      </header>

      <main className="app-main">
        <div className="container">
          <div className="input-section">
            <RepositoryInput 
              onSubmit={handleRunProject} 
              isLoading={isRunning}
            />
          </div>

          {(logs.length > 0 || isRunning || error) && (
            <div className="output-section">
              <h2>📊 Execution Output</h2>
              {currentRepo && (
                <div className="repo-info">
                  Repository: <code>{currentRepo}</code>
                </div>
              )}
              <TerminalOutput 
                logs={logs} 
                isRunning={isRunning}
                error={error}
              />
            </div>
          )}
        </div>
      </main>

      <footer className="app-footer">
        <p>
          GitHub Project Runner © 2026 | 
          <a href="https://github.com">GitHub</a> | 
          <a href="#docs">Documentation</a> |
          <a href="#about">About</a>
        </p>
      </footer>
    </div>
  );
}

export default App;
