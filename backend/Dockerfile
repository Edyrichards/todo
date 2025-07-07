# Use an official Node.js runtime as a parent image
FROM node:20-alpine AS builder

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (or npm-shrinkwrap.json)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the TypeScript code
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /usr/src/app

# Copy built artifacts from builder stage
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package*.json ./

# Expose the port the app runs on
# The port is set via the PORT environment variable in docker-compose.yml
# EXPOSE ${PORT}

# Command to run the application
CMD ["node", "dist/index.js"]
