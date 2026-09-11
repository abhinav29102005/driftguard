#!/bin/bash
# Start backend
cd /app/backend
python3 -c "import sys; sys.path.insert(0, '.'); from server import app; import uvicorn; uvicorn.run(app, host='0.0.0.0', port=8000)" &

# Start frontend
cd /app/driftguard
npm run start
