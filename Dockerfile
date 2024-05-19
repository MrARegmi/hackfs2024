# Base image
FROM node:18.17 AS builder

# Set Working Directory
WORKDIR /hackfs2024

# Copy root package files and install dependencies
COPY package.json yarn.lock ./
RUN yarn install

# Copy package files and install dependencies for frontend
COPY packages/nextjs/package.json ./packages/nextjs/
RUN cd packages/nextjs && yarn install 

# Copy package files and install dependencies for hardhat
COPY packages/hardhat/package.json ./packages/hardhat/
RUN cd packages/hardhat && yarn install 

# Copy the source files
COPY packages/backend ./packages/backend
COPY packages/nextjs ./packages/nextjs
COPY packages/hardhat ./packages/hardhat

# Expose necessary ports
EXPOSE 3000 8080 

# Start all services
CMD ["sh", "-c", "\
  yarn chain & \
  yarn deploy && \
  cd packages/backend && node server.js & \
  yarn build && yarn start"]
