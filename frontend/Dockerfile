# ---------- Stage 1: Build React app ----------

# Use Node image to build the frontend project.
FROM node:20-alpine AS build

# Set working folder inside container.
WORKDIR /app

# Copy package files first.
# This helps Docker cache npm install.
COPY package*.json ./

# Install frontend dependencies.
RUN npm install

# Copy all frontend source code.
COPY . .

# Build the React app for production.
# This creates a dist folder.
RUN npm run build


# ---------- Stage 2: Serve React app using Nginx ----------

# Use small Nginx image to serve built files.
FROM nginx:alpine

# Copy custom Nginx config.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built React files from build stage into Nginx html folder.
COPY --from=build /app/dist /usr/share/nginx/html

# Nginx runs on port 80 inside the container.
EXPOSE 80

# Start Nginx.
CMD ["nginx", "-g", "daemon off;"]