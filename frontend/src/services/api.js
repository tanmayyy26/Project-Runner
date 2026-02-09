/**
 * GitHub Project Runner - Frontend API Service
 * 
 * Handles communication with the backend API
 */

// Detect API URL based on environment
const getAPIBaseUrl = () => {
  // In production, use same origin (Express serves both frontend and backend)
  if (window.location.hostname !== 'localhost') {
    return `${window.location.protocol}//${window.location.host}`;
  }
  // In development, backend might be on different port
  return process.env.REACT_APP_API_URL || 'http://localhost:5000';
};

const API_BASE_URL = getAPIBaseUrl();

console.log('🔌 API Base URL:', API_BASE_URL);


/**
 * Run a GitHub project with automatic reconnection
 * 
 * @param {string} repositoryUrl - GitHub repository URL
 * @param {string} branch - Branch name (default: main)
 * @param {Function} onMessage - Callback for streaming messages
 * @returns {Promise<void>}
 */
export const runProject = (repositoryUrl, branch = 'main', onMessage) => {
  return new Promise((resolve, reject) => {
    let eventSource = null;
    let reconnectAttempts = 0;
    let maxReconnectAttempts = 10;
    let isCompleted = false;
    let lastMessageTime = Date.now();

    const connect = () => {
      if (isCompleted) return;

      eventSource = new EventSource(
        `${API_BASE_URL}/run?url=${encodeURIComponent(repositoryUrl)}&branch=${encodeURIComponent(branch)}`,
        { withCredentials: false }
      );

      eventSource.onmessage = (event) => {
        try {
          lastMessageTime = Date.now();
          const data = JSON.parse(event.data);
          onMessage(data);

          // Close connection on completion or error
          if (data.status === 'completed' || data.status === 'error') {
            isCompleted = true;
            eventSource.close();
            if (data.status === 'error') {
              reject(new Error(data.message));
            } else {
              resolve();
            }
          }
        } catch (error) {
          console.error('Error parsing message:', error);
          onMessage({
            status: 'error',
            message: 'Failed to parse server response'
          });
        }
      };

      eventSource.onerror = (error) => {
        console.error('❌ EventSource connection failed:', error);
        eventSource.close();

        if (isCompleted) return;

        // Attempt to reconnect if we haven't exceeded max attempts
        if (reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts - 1), 10000);
          
          onMessage({
            status: 'warning',
            message: `⚠️ Connection lost. Reconnecting (attempt ${reconnectAttempts}/${maxReconnectAttempts})...`
          });

          setTimeout(() => {
            console.log(`Reconnecting... (attempt ${reconnectAttempts})`);
            connect();
          }, delay);
        } else {
          reject(new Error(
            `Backend connection failed after ${maxReconnectAttempts} attempts.\nTrying: ${API_BASE_URL}/run`
          ));
        }
      };

      // Reset reconnect attempts on successful connection
      eventSource.onopen = () => {
        console.log('EventSource connection established');
        reconnectAttempts = 0;
      };
    };

    connect();
  });
};

/**
 * Alternative: Use fetch with POST (in case EventSource doesn't work)
 */
export const runProjectWithFetch = async (repositoryUrl, branch = 'main', onMessage) => {
  try {
    const response = await fetch(`${API_BASE_URL}/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: repositoryUrl,
        branch
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to run project');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = decoder.decode(value);
      const lines = text.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.substring(6));
            onMessage(data);
          } catch (error) {
            console.error('Error parsing line:', error);
          }
        }
      }
    }
  } catch (error) {
    onMessage({
      status: 'error',
      message: error.message
    });
    throw error;
  }
};

/**
 * Check backend health
 * 
 * @returns {Promise<Object>}
 */
export const checkHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) throw new Error('Health check failed');
    return await response.json();
  } catch (error) {
    throw new Error(`Backend is not responding: ${error.message}`);
  }
};
