# docker/Dockerfile
FROM n8nio/n8n:1.122.2

USER node
WORKDIR /home/node

# copy workspace files
COPY --chown=node:node package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY --chown=node:node tsconfig.json ./

# copy node packages
COPY --chown=node:node nodes/ ./nodes/

# Install pnpm (cached unless pnpm version changes)
USER root
RUN echo "Disabling corepack and installing pnpm..." && \
    corepack disable && \
    npm install -g pnpm@10.19.0

# Install dependencies (cached unless package.json or pnpm-lock.yaml changes)
RUN echo "Installing dependencies with pnpm..." && \
    NODE_ENV=development pnpm install

# Build packages (cached unless source code changes)
RUN echo "Building all packages..." && \
    pnpm -r build

# Pack and install packages (cached unless build output changes)
RUN echo "Packing and installing packages..." && \
    for d in nodes/*; do \
      cd "$d"; \
      pnpm pack; \
      npm install -g *.tgz; \
      cd /home/node; \
    done

# Also copy the built packages to .n8n/nodes for discovery
RUN mkdir -p /root/.n8n/nodes && \
    for d in nodes/*; do \
      cp -r "$d/dist" "/root/.n8n/nodes/$(basename $d)"; \
      cp "$d/package.json" "/root/.n8n/nodes/$(basename $d)/"; \
    done

# Stay as root user to handle Railway volume permissions
# USER node

ENV N8N_DIAGNOSTICS_ENABLED=false \
    N8N_SECURE_COOKIE=true \
    N8N_HOST=0.0.0.0 \
    N8N_CUSTOM_EXTENSIONS="/home/node/nodes"

# Use the original n8n entrypoint but run as root
ENTRYPOINT ["tini", "--", "/usr/local/bin/docker-entrypoint.sh"]
CMD ["n8n", "start"]

