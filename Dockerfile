FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application files
COPY src/ ./src/
COPY public/ ./public/

# Expose port
EXPOSE 3001

# Set default environment variables
ENV PORT=3001
ENV CLOUD_TASKS_EMULATOR_HOST=cloud-tasks-emulator:8123
ENV GCP_PROJECT=local-project
ENV GCP_LOCATION=us-central1

# Start the application
CMD ["npm", "start"]
