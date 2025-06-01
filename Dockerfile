# Stage 1: Use an official Node.js LTS Alpine image for a smaller footprint
FROM node:18-alpine AS base

# Set the working directory for backend code within the container
# All subsequent commands will be run from this directory
WORKDIR /usr/src/app/backend

# Copy only package.json and package-lock.json from the backend directory first
# This leverages Docker's layer caching. If these files don't change,
# Docker won't re-run 'npm ci' in subsequent builds.
COPY ./backend/package*.json ./

# Install production dependencies for the backend
# 'npm ci' is generally recommended for CI/production for consistency with package-lock.json
# '--omit=dev' ensures devDependencies are not installed in the final image
RUN npm ci

# Copy the rest of the backend application code into the WORKDIR
COPY ./backend/ ./

# Ensure necessary directories exist within the container's WORKDIR
# These paths are relative to /usr/src/app/backend
# The application will write to these; Docker volumes will map them to the host.
# chown might be needed if you run the container as a non-root user.
# For the default node user (often root in -alpine images unless specified),
# mkdir is usually sufficient. If using USER node, chown is important.
RUN mkdir -p database uploads/documents
# If you switch to USER node later:
# RUN chown -R node:node database uploads

# (Optional but recommended) Define a non-root user to run the application
# USER node

# Expose the port the application will run on *inside* the container
# This should match the PORT environment variable your app uses
ARG PORT=3001
ENV PORT=${PORT}
EXPOSE ${PORT}

# Command to run the application
# This will execute 'npm start' from /usr/src/app/backend
CMD [ "npm", "start" ]