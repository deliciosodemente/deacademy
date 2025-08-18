# Use a lightweight Nginx image
FROM nginx:alpine

# Copy all the files from the current directory to the Nginx public directory
COPY . /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx when the container launches
CMD ["nginx", "-g", "daemon off;"]
