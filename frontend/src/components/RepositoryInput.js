/**
 * RepositoryInput Component
 * 
 * Allows user to input a GitHub repository URL
 */

import React, { useState } from 'react';
import '../styles/RepositoryInput.css';

export default function RepositoryInput({ onSubmit, isLoading }) {
  const [url, setUrl] = useState('');
  const [branch, setBranch] = useState('main');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Validate URL
    if (!url.trim()) {
      setError('Please enter a GitHub repository URL');
      return;
    }

    if (!isValidGitHubUrl(url)) {
      setError('Invalid GitHub URL. Please use format: https://github.com/user/repo');
      return;
    }

    onSubmit(url, branch);
  };

  const isValidGitHubUrl = (urlString) => {
    const pattern = /^(https?:\/\/)?(www\.)?github\.com\/[\w-]+\/[\w.-]+(\/.git)?$/;
    return pattern.test(urlString);
  };

  return (
    <div className="repository-input-container">
      <div className="input-card">
        <h2>🚀 GitHub Project Runner</h2>
        <p className="subtitle">Run any public GitHub repository without downloading it</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="repo-url">Repository URL</label>
            <input
              id="repo-url"
              type="text"
              placeholder="https://github.com/username/repository"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setError('');
              }}
              disabled={isLoading}
              className="input-field"
            />
            <small>Example: https://github.com/facebook/react</small>
          </div>

          <div className="form-group">
            <label htmlFor="branch">Branch (optional)</label>
            <input
              id="branch"
              type="text"
              placeholder="main"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              disabled={isLoading}
              className="input-field"
            />
          </div>

          {error && <div className="error-message">❌ {error}</div>}

          <button
            type="submit"
            disabled={isLoading}
            className={`submit-button ${isLoading ? 'loading' : ''}`}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                Running...
              </>
            ) : (
              '▶️ Run Project'
            )}
          </button>
        </form>

        <div className="info-box">
          <h4>ℹ️ How it works</h4>
          <ul>
            <li>Paste any public GitHub repository URL</li>
            <li>We automatically detect the project type</li>
            <li>The project runs in an isolated Docker container</li>
            <li>Watch the live output stream in real-time</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
