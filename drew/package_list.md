# Package List

## Directly Based on Current Files

These packages are essential for the functionalities defined across your system.

### Core Functionality
- **`@prisma/client`, `pg`**:  
  Database management and schema modeling using Prisma and PostgreSQL.
- **`dotenv`**:  
  Managing environment variables securely.

### Web Scraping
- **`puppeteer`, `cheerio`, `robots-txt-parser`**:  
  Web scraping, metadata extraction, and validation.

### Real-Time Updates
- **`ws`**:  
  WebSocket-based progress updates.

### AI and LLM Integration
- **`openai`, `@anthropic-ai/sdk`, `@not-diamond/sdk`, `@flux-ai/sdk`**:  
  Supports routing and integration with LLMs for tasks like content analysis, routing, and RAG workflows.

### Data Analysis
- **`wordcloud`**:  
  Generating word cloud visualizations for insights from text analysis.

### Utilities
- **`node-fetch`, `axios`**:  
  For handling HTTP requests across various APIs.
- **`zod`, `ajv`**:  
  For schema validation of API inputs and responses.

### Database Management
- **`prisma`, `@prisma/client`**:  
  Database schema management and querying.
- **`winston`**:  
  Enhanced logging for operational insights.

---

## Extra Packages for Broader Use

These packages add functionality that supports scalability and robustness.

### Job Scheduling
- **`bull`, `node-schedule`**:  
  For managing asynchronous scraping and periodic updates.

### File Handling
- **`multer`, `pdf-parse`, `csv-parser`**:  
  Supports uploading and processing files, including PDFs and CSVs.

### Error Tracking and Logging
- **`sentry`**:  
  Tracks and monitors runtime errors in production.

### Performance Optimization
- **`redis`**:  
  Caching for high-volume API responses.
- **`compression`**:  
  Compressing API responses for improved client-side performance.

### Testing Tools
- **`jest`, `supertest`**:  
  Frameworks for robust testing of API endpoints and system workflows.

### GraphQL Support
- **`apollo-server-express`, `graphql`**:  
  To accommodate future GraphQL integrations.
