# Use the official Microsoft image with all browser libraries built-in
FROM mcr.microsoft.com/playwright:v1.42.1-jammy

# Set working directory
WORKDIR /app

# Copy and install dependencies for the bot
COPY model/package*.json ./model/
RUN cd model && npm install

# Copy the actual bot code
COPY model/ ./model/

# Start the bot
CMD ["node", "model/index.js"]
