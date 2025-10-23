# docker/Dockerfile
FROM n8nio/n8n:1.64.0

USER node
WORKDIR /home/node

# copy manifests first for cache
COPY nodes/*/package.json ./nodes-manifests/
RUN mkdir -p /home/node/custom

# then sources
COPY nodes/ /home/node/custom/

RUN set -e; \
  for d in /home/node/custom/*; do \
    cd "$d"; npm ci --omit=dev; npm run build; npm pack; \
    npm install -g *.tgz; \
  done

ENV N8N_USER_FOLDER=/data \
    N8N_DIAGNOSTICS_ENABLED=false \
    N8N_SECURE_COOKIE=true \
    N8N_PORT=5678 \
    N8N_HOST=0.0.0.0
