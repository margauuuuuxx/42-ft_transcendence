#!/bin/sh
set -eu

SSL_DIR="/etc/nginx/ssl"
CRT="/transcendance.crt"
KEY="/transcendance.key"

if [ ! -f "${SSL_DIR}${CRT}" ] || [ ! -f "${SSL_DIR}${KEY}" ]; then
   openssl req -x509 -nodes \
   -out ${SSL_DIR}${CRT} \
   -keyout ${SSL_DIR}${KEY} \
   -subj "/C=BE/ST=BX/L=BX/O=42/OU=42/CN=localhost" \
   -addext "subjectAltName=DNS:localhost" >/dev/null 2>&1
fi

exec nginx -g "daemon off;"