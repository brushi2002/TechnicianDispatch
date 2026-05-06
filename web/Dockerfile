# Dev image for the Vite frontend. Source is mounted as a volume at runtime
# for HMR. --host 0.0.0.0 makes the dev server reachable outside the container.
FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
