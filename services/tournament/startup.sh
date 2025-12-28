#!/bin/bash

cd /usr/src/app/tournament

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Build TypeScript if dist doesn't exist
if [ ! -d "dist" ]; then
    echo "Building TypeScript..."
    npm run build
fi

# Start the server
echo "Starting Tournament Service..."
npm start 
