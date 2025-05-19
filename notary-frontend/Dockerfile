FROM node:18-alpine as build

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json ./
COPY bun.lockb ./

# Install dependencies
RUN npm install -g bun
RUN bun install

# Copy all files
COPY . .

# Build the app
RUN bun run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy built assets from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx config
COPY ./nginx.conf /etc/nginx/conf.d/default.conf


# Start Nginx server
CMD ["nginx", "-g", "daemon off;"]
