# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

COPY dist ./

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# Install application dependencies
# RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port your application listens on (e.g., 3000 or 8080)
EXPOSE 8080

# Command to run the application
CMD ["npm", "start"]
# Or if you use yarn: CMD ["yarn", "start"]
