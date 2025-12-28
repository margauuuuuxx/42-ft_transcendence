#!/bin/sh
set -eu

echo "[game] Starting container..."

if [ ! -d node_modules ] || [ -z "$(ls -A node_modules 2>/dev/null)" ]; then
  echo "[game] node_modules missing, running npm install..."
  npm install
fi

npm run build

echo "[game] Launching server..."
exec node dist/server.js