# Use node base image for the builder stage
FROM node:18.17 AS builder

# Set Working Directory
WORKDIR /hackfs2024

# Copy root package files and install dependencies
COPY package.json yarn.lock ./
RUN yarn install --ignore-scripts

# Copy package files and install dependencies for frontend
COPY packages/nextjs/package.json ./packages/nextjs/
RUN cd packages/nextjs && yarn install --ignore-scripts

# Copy package files and install dependencies for hardhat
COPY packages/hardhat/package.json ./packages/hardhat/
RUN cd packages/hardhat && yarn install --ignore-scripts

# Copy the source files
COPY packages/backend ./packages/backend
COPY packages/nextjs ./packages/nextjs
COPY packages/hardhat ./packages/hardhat
COPY rust-modules/wasm-lib ./rust-modules/wasm-lib

# Additional setup for fluence-module
COPY fluence-module ./fluence-module

# Expose necessary ports
EXPOSE 3000 8545 8080

# Run fluence commands and start all services
CMD ["sh", "-c", "\
  cd fluence-module && \
  fluence dep i && \
  fluence update dar && \
  fluence build && \
  fluence default env local && \
  fluence local init && \
  fluence local up && \
  fluence deploy --priv-key 0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6 && \
  cd src/gateway && npm install && npm run start & \
  cd /hackfs2024 && yarn chain & \
  yarn deploy && \
  cd packages/backend && node server.js & \
  cd /hackfs2024 && yarn start"]
