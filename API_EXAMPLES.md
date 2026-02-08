# API Execution Examples

## Example 1: Running a Node.js Project

### Request
```bash
curl -X POST http://localhost:5000/run \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://github.com/lodash/lodash",
    "branch": "main"
  }'
```

### Expected Response (SSE Stream)
```
data: {"status":"started","id":"abc123de","message":"Initializing project execution..."}

data: {"status":"progress","message":"📥 Cloning repository from https://github.com/lodash/lodash..."}

data: {"status":"progress","message":"✅ Repository cloned successfully"}

data: {"status":"progress","message":"🔍 Detecting project type..."}

data: {"status":"progress","message":"✅ Detected Node.js project"}

data: {"status":"progress","message":"🐳 Preparing Docker container..."}

data: {"status":"output","message":"npm notice created a lockfile as package-lock.json"}

data: {"status":"output","message":"added 123 packages in 45s"}

data: {"status":"output","message":"> lodash@4.17.21 start"}

data: {"status":"progress","message":"🎉 Project execution finished successfully!"}

data: {"status":"completed","id":"abc123de","message":"Project execution completed"}
```

---

## Example 2: Running a Python Project

### Request
```bash
curl -X POST http://localhost:5000/run \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://github.com/pallets/flask",
    "branch": "main"
  }'
```

### Expected Response
```
data: {"status":"started","id":"def456gh","message":"Initializing project execution..."}

data: {"status":"progress","message":"📥 Cloning repository..."}

data: {"status":"progress","message":"✅ Repository cloned successfully"}

data: {"status":"progress","message":"🔍 Detecting project type..."}

data: {"status":"progress","message":"✅ Detected Python project"}

data: {"status":"output","message":"Collecting Flask==2.3.0..."}

data: {"status":"output","message":"Successfully installed Flask"}

data: {"status":"output","message":" * Running on http://127.0.0.1:5000"}

data: {"status":"completed","id":"def456gh","message":"Project execution completed"}
```

---

## Example 3: Error Handling

### Request (Invalid URL)
```bash
curl -X POST http://localhost:5000/run \
  -H "Content-Type: application/json" \
  -d '{
    "url": "not-a-valid-url"
  }'
```

### Response
```json
{
  "error": "Invalid GitHub repository URL format",
  "status": 400
}
```

### Request (Non-existent Repository)
```bash
curl -X POST http://localhost:5000/run \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://github.com/this-user/does-not-exist"
  }'
```

### SSE Response
```
data: {"status":"started","id":"xyz789ab","message":"Initializing project execution..."}

data: {"status":"progress","message":"📥 Cloning repository..."}

data: {"status":"error","id":"xyz789ab","message":"❌ Error: Failed to clone repository: Repository not found","error":true}
```

---

## Example 4: Health Check

### Request
```bash
curl http://localhost:5000/health
```

### Response
```json
{
  "status": "ok",
  "timestamp": "2026-02-08T10:30:45.123Z",
  "docker": "enabled"
}
```

---

## Frontend Integration Example

### Using Fetch API
```javascript
async function runProject(url, branch = 'main') {
  const response = await fetch('http://localhost:5000/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, branch })
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const text = decoder.decode(value);
    const lines = text.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.substring(6));
        console.log(data);
      }
    }
  }
}
```

### Using EventSource
```javascript
function runProject(url, branch = 'main') {
  const eventSource = new EventSource(
    `/run?url=${encodeURIComponent(url)}&branch=${encodeURIComponent(branch)}`
  );

  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log(data);

    if (data.status === 'completed' || data.status === 'error') {
      eventSource.close();
    }
  };
}
```

---

## Testing with cURL

### Test Backend Health
```bash
#!/bin/bash

# Health check
curl -s http://localhost:5000/health | jq '.'

# Run simple project
curl -s -X POST http://localhost:5000/run \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://github.com/nodejs/nodejs.org",
    "branch": "main"
  }' | grep -oP 'data: \K.*'
```

### Bash Test Script
```bash
#!/bin/bash

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "Testing GitHub Project Runner API"
echo "=================================="

# Test 1: Health check
echo ""
echo "Test 1: Health Check"
RESPONSE=$(curl -s http://localhost:5000/health)
if echo "$RESPONSE" | grep -q "ok"; then
    echo -e "${GREEN}✅ PASSED${NC}"
else
    echo -e "${RED}❌ FAILED${NC}"
fi

# Test 2: Invalid URL
echo ""
echo "Test 2: Invalid URL Validation"
RESPONSE=$(curl -s -X POST http://localhost:5000/run \
  -H "Content-Type: application/json" \
  -d '{"url":"invalid"}')
if echo "$RESPONSE" | grep -q "Invalid"; then
    echo -e "${GREEN}✅ PASSED${NC}"
else
    echo -e "${RED}❌ FAILED${NC}"
fi

# Test 3: Project execution (Node.js)
echo ""
echo "Test 3: Node.js Project Execution"
curl -s -X POST http://localhost:5000/run \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://github.com/lodash/lodash",
    "branch": "main"
  }' | head -n 5
```
