/**
 * Terminal Output Component
 * 
 * Displays logs from the running project in a terminal-style interface
 */

import React, { useEffect, useRef } from 'react';
import '../styles/TerminalOutput.css';

export default function TerminalOutput({ logs, isRunning, error }) {
  const terminalRef = useRef(null);

  // Auto-scroll to bottom when new logs appear
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  const getLogIcon = (type) => {
    switch (type) {
      case 'progress':
        return '🔄';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'started':
        return '▶️';
      case 'completed':
        return '✅';
      default:
        return '📝';
    }
  };

  const getLogClassName = (log) => {
    if (log.error || log.status === 'error') return 'log-line error';
    if (log.status === 'warning') return 'log-line warning';
    if (log.isError) return 'log-line stderr';
    return 'log-line';
  };

  return (
    <div className="terminal-output-container">
      <div className="terminal-header">
        <div className="terminal-title">
          <span className="terminal-status">
            {isRunning ? (
              <>
                <span className="status-indicator running"></span>
                Running...
              </>
            ) : (
              <>
                <span className="status-indicator"></span>
                Idle
              </>
            )}
          </span>
        </div>
      </div>

      <div className="terminal-content" ref={terminalRef}>
        {logs.length === 0 ? (
          <div className="empty-state">
            <p>📋 Logs will appear here when you run a project</p>
          </div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className={getLogClassName(log)}>
              {log.status && (
                <span className="log-icon">{getLogIcon(log.status)}</span>
              )}
              <span className="log-text">
                {log.message}
              </span>
            </div>
          ))
        )}

        {error && (
          <div className="log-line error final-error">
            <span className="log-icon">❌</span>
            <span className="log-text">{error}</span>
          </div>
        )}
      </div>

      <div className="terminal-footer">
        <small>
          {logs.length > 0 && (
            <>
              {logs.length} line{logs.length !== 1 ? 's' : ''} • 
              {isRunning ? ' Running' : ' Completed'}
            </>
          )}
        </small>
      </div>
    </div>
  );
}
