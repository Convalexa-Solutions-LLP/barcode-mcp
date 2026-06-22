# Remote (Streamable HTTP) MCP server. Build: docker build -t convalexa-barcode-mcp .
# Run:   docker run -p 8787:8787 -e MCP_API_KEY=yourkey convalexa-barcode-mcp
FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY src ./src
ENV PORT=8787
EXPOSE 8787
CMD ["node", "src/http.js"]
