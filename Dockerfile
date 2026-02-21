FROM node:18-alpine

WORKDIR /app

# Copy frontend package.json
COPY package*.json ./
RUN npm install

# Copy frontend source code
COPY . .

# Build the frontend
RUN npm run build

# Serve the built frontend
RUN npm install -g serve
CMD ["serve", "-s", "dist", "-l", "3000"]
