# docker/Dockerfile
FROM n8nio/n8n:1.64.0

USER node
WORKDIR /home/node

# copy workspace files
COPY --chown=node:node package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY --chown=node:node tsconfig.json ./

# copy node packages
COPY --chown=node:node nodes/ ./nodes/

USER root
RUN echo "Disabling corepack and installing pnpm..." && \
    corepack disable && \
    npm install -g pnpm@10.19.0 && \
    echo "Installing dependencies with pnpm..." && \
    NODE_ENV=development pnpm install && \
    echo "Building all packages..." && \
    pnpm -r build && \
    echo "Packing and installing packages..." && \
    for d in nodes/*; do \
      cd "$d"; \
      pnpm pack; \
      npm install -g *.tgz; \
      cd /home/node; \
    done
USER node

ENV N8N_USER_FOLDER=/data \
    N8N_DIAGNOSTICS_ENABLED=false \
    N8N_SECURE_COOKIE=true \
    N8N_PORT=5678 \
    N8N_HOST=0.0.0.0
