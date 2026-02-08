/**
 * GitHub Project Runner - Frontend API Service
 * 
 * Handles communication with the backend API
 */

// Use relative paths - works with both local and production servers
const API_BASE_URL = '';

/**
 * Run a GitHub project
 * 
 * @param {string} repositoryUrl - GitHub repository URL
 * @param {string} branch - Branch name (default: main)
 * @param {Function} onMessage - Callback for streaming messages
 * @returns {Promise<void>}
 */
export const runProject = (repositoryUrl, branch = 'main', onMessage) => {
  return new Promise((resolve, reject) => {
    const eventSource = new EventSource(
      `${API_BASE_URL}/run?url=${encodeURIComponent(repositoryUrl)}&branch=${encodeURIComponent(branch)}`,
      { withCredentials: false }
    );

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);

        // Close connection on completion or error
        if (data.status === 'completed' || data.status === 'error') {
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
      console.error('EventSource error:', error);
      eventSource.close();
      reject(new Error('Connection to server failed'));
    };
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
