# API Guide and File Documentation
// can also check out the UI Development Guide.txt

# System File Organization

## 1. Funnel and Milestone Management

**Narrative**  
Tracks user progress through structured funnels and milestones, ensuring prerequisites are met, updating progress, and integrating insights for optimized user journeys.

---

### Core Files

#### `api/routes/funnel-progress.ts`
- **Description**: Retrieves and calculates funnel progress for users and teams, validates prerequisites, and organizes data for endpoints.
- **What Developers Need to Send**:
  - **HTTP Method**: `GET`
  - **Query Parameters**:
    - `teamId` (optional): To filter progress by team.
    - `userId` (optional): To filter progress by a specific user.
- **Response**:
  - **Success**:
    - `200 OK`: JSON object with user/team progress, milestones, and prerequisites.
    - Example:
      ```json
      {
        "userId": "123",
        "teamId": "456",
        "progress": {
          "completed": 3,
          "total": 5
        }
      }
      ```
  - **Errors**:
    - `400 Bad Request`: Missing or invalid parameters.
    - `404 Not Found`: No progress data found.
- **Supporting Files**:
  - `lib/prisma.ts`: Manages database connections.
  - `services/updateFunnelProgress.ts`: Updates user progress.
  - `types/funnels.ts`: Defines funnel structures.

---

#### `api/routes/milestone-chat.ts`
- **Description**: Manages milestone-specific conversations, setting up context-rich discussions and generating agent prompts.
- **What Developers Need to Send**:
  - **HTTP Method**: `POST`
  - **Payload**:
    ```json
    {
      "userId": "123",
      "milestoneId": "456",
      "context": "string"
    }
    ```
- **Response**:
  - **Success**:
    - `201 Created`: JSON object with the initialized conversation details.
    - Example:
      ```json
      {
        "conversationId": "789",
        "milestoneId": "456",
        "status": "initiated"
      }
      ```
  - **Errors**:
    - `400 Bad Request`: Missing or invalid payload.
    - `500 Internal Server Error`: Unable to initiate conversation.
- **Supporting Files**:
  - `services/agent-context.ts`: Prepares agent-specific context.
  - `services/context-gatherer.ts`: Gathers user and milestone context.

---

#### Services

##### `services/updateFunnelProgress.ts`
- **Description**: Updates user progress in funnels based on analyzed chat data.
- **What Developers Need to Send**:
  - **Method Call**: `updateFunnelProgress(userId, funnelId, milestoneData)`
  - **Parameters**:
    - `userId`: The user's ID.
    - `funnelId`: The funnel ID being updated.
    - `milestoneData`: Progress updates for specific milestones.
- **Response**:
  - **Success**:
    - Returns the updated progress object:
      ```json
      {
        "userId": "123",
        "funnelId": "456",
        "completed": 4,
        "total": 5
      }
      ```
  - **Errors**:
    - Throws validation errors for invalid data or IDs.

---

##### `services/tool-progress.ts`
- **Description**: Tracks tool-specific usage as part of funnel progress.
- **What Developers Need to Send**:
  - **Method Call**: `trackToolUsage(userId, toolName, usageMetrics)`
  - **Parameters**:
    - `userId`: The user's ID.
    - `toolName`: Name of the tool being used.
    - `usageMetrics`: Metrics or interaction data for the tool.
- **Response**:
  - **Success**:
    - Returns an acknowledgment of the logged usage.
    - Example:
      ```json
      {
        "status": "logged",
        "toolName": "Buyer Persona",
        "usageCount": 10
      }
      ```
  - **Errors**:
    - Throws if tool data is missing or invalid.

---

##### `services/user-progress.ts`
- **Description**: Provides a centralized view of user achievements.
- **What Developers Need to Send**:
  - **Method Call**: `getUserProgress(userId)`
  - **Parameters**:
    - `userId`: The ID of the user.
- **Response**:
  - **Success**:
    - Returns detailed progress data for the user.
    - Example:
      ```json
      {
        "userId": "123",
        "funnels": [
          {
            "funnelId": "1",
            "completed": 2,
            "total": 4
          }
        ]
      }
      ```
  - **Errors**:
    - Throws if `userId` is missing or invalid.

---

##### `services/project-manager.ts`
- **Description**: Links projects to funnels and milestones for streamlined management.
- **What Developers Need to Send**:
  - **Method Call**: `createProject(projectData)`
  - **Parameters**:
    - `projectData`: Object containing project details, associated funnels, and milestones.
- **Response**:
  - **Success**:
    - Returns the created project details.
    - Example:
      ```json
      {
        "projectId": "123",
        "name": "Project Alpha",
        "associatedFunnels": ["funnel1", "funnel2"]
      }
      ```
  - **Errors**:
    - Throws for invalid or duplicate project data.


#### Types
- **`types/funnels.ts`**  
  Defines structures and prerequisites for funnels and milestones.




#### `services/form-chat-context.ts`
- **Description**: Manages the collection and aggregation of contextual data required for chat-based forms within a funnel or milestone workflow.
- **What Developers Need to Send**:
  - **Method Call**: `getChatContext(userId, formId, contextDetails)`
  - **Parameters**:
    - `userId` (string): The user requesting context.
    - `formId` (string): The form associated with the milestone or funnel.
    - `contextDetails` (object): Optional data to enrich the chat context.
- **Response**:
  - **Success**:
    - Returns the aggregated context for the form chat:
      ```json
      {
        "userId": "123",
        "formId": "456",
        "context": {
          "milestoneData": {...},
          "previousResponses": [...],
          "additionalDetails": {...}
        }
      }
      ```
  - **Errors**:
    - `400 Bad Request`: Missing or invalid parameters.
    - `404 Not Found`: No context available for the specified form.
    - `500 Internal Server Error`: Unexpected processing error.
- **Supporting Files**:
  - `services/agent-context.ts`: Provides agent-specific data for chat prompts.
  - `services/context-gatherer.ts`: Aggregates milestone and user data for context enrichment.

---

#### `pages/api/funnel-progress.ts`
- **Description**: API route for tracking and reporting funnel progress for users or teams.
- **What Developers Need to Send**:
  - **HTTP Method**: `GET`
  - **Query Parameters**:
    - `userId` (string, optional): The user whose progress needs to be fetched.
    - `teamId` (string, optional): The team whose collective progress is required.
- **Response**:
  - **Success**:
    - `200 OK`: JSON object summarizing the progress of the user or team.
      ```json
      {
        "progress": [
          {
            "funnelId": "1",
            "completed": 5,
            "total": 10,
            "milestones": [
              {"milestoneId": "m1", "status": "completed"},
              {"milestoneId": "m2", "status": "pending"}
            ]
          }
        ]
      }
      ```
  - **Errors**:
    - `400 Bad Request`: Invalid or missing parameters.
    - `404 Not Found`: No progress data available for the requested user or team.
- **Supporting Files**:
  - `services/updateFunnelProgress.ts`: Updates user and team progress records.
  - `lib/prisma.ts`: Handles database operations related to funnel progress.
  - `types/funnels.ts`: Defines the structure and validation for funnel-related data.

---

#### `services/form-manager.ts`
- **Description**: Handles the creation, retrieval, and updates for forms linked to funnels and milestones.
- **What Developers Need to Send**:
  - **Method Call**: 
    - `createForm(formData)`
      - **Parameters**:
        - `formData` (object): Details of the form to be created (e.g., name, fields, associated milestone).
      - **Response**:
        - **Success**:
          ```json
          {
            "formId": "789",
            "name": "New Form",
            "fields": [
              {"fieldId": "1", "type": "text", "label": "Name"}
            ]
          }
          ```
        - **Errors**:
          - `400 Bad Request`: Invalid form data.
          - `500 Internal Server Error`: Unexpected error during creation.
    - `getForm(formId)`
      - **Parameters**:
        - `formId` (string): The ID of the form to retrieve.
      - **Response**:
        - **Success**:
          ```json
          {
            "formId": "789",
            "name": "New Form",
            "fields": [
              {"fieldId": "1", "type": "text", "label": "Name"}
            ]
          }
          ```
        - **Errors**:
          - `404 Not Found`: Form not found.
          - `400 Bad Request`: Invalid form ID.
- **Supporting Files**:
  - `services/project-manager.ts`: Links forms to projects and milestones.
  - `lib/prisma.ts`: Handles database interactions for form data.
  - `types/global.d.ts`: Defines form-related types and validations.




---





## 2. Conversation Analysis and Intelligence

### Narrative
Extracts insights from conversations using LLMs, tracks progress, and generates actionable data for improving user interactions and funnel advancement.

---

### Core Files

#### Analysis and Intelligence

- **`api/services/analyzeChatContent.ts`**  
  - **Description**:  
    Analyzes chat content with LLMs to extract critical data for funnel updates.  
  - **API Methods**:  
    - `analyzeChat`:  
      - **Input**:  
        - `conversationId` (string): The ID of the conversation to analyze.  
        - `userId` (string): The user initiating the request.  
      - **Output**:  
        - Extracted data points for milestones and funnel progress updates.  
      - **Errors**:  
        - Invalid conversation ID or missing context.  
  - **Supporting Files**:  
    - `api/services/conversation-intelligence.ts`: Integrates insights into milestone tracking.  
    - `services/updateFunnelProgress.ts`: Updates funnel progress.

- **`api/services/conversation-intelligence.ts`**  
  - **Description**:  
    Processes conversations to extract insights about milestone completion.  
  - **API Methods**:  
    - `processConversation`:  
      - **Input**:  
        - `conversationData` (object): Parsed conversation messages.  
      - **Output**:  
        - Insights object containing milestone completion status.  
      - **Errors**:  
        - Failed analysis or incomplete conversation data.  
  - **Supporting Files**:  
    - `services/context-gatherer.ts`: Collects relevant data for analysis.  
    - `services/conversation-analyzer.ts`: Extracts actionable insights.

---

#### Context Management

- **`services/context-gatherer.ts`**  
  - **Description**:  
    Collects user and conversation data for context-aware interactions.  
  - **API Methods**:  
    - `gatherContext`:  
      - **Input**:  
        - `userId` (string): The user requesting context.  
        - `conversationId` (string): The ID of the conversation.  
      - **Output**:  
        - Structured conversation context with user data, progress, and milestone details.  
      - **Errors**:  
        - Missing or invalid conversation/user ID.  

- **`services/agent-context.ts`**  
  - **Description**:  
    Prepares context for agents with relevant user and milestone data.  
  - **API Methods**:  
    - `prepareAgentContext`:  
      - **Input**:  
        - `userId` (string): The user requesting context.  
        - `milestoneId` (string): The milestone associated with the agent.  
      - **Output**:  
        - Context object enriched with milestone and progress data.  
      - **Errors**:  
        - Invalid milestone or user ID.  

---

#### Lifecycle Management

- **`services/conversation-manager.ts`**  
  - **Description**:  
    Manages the creation and metadata of conversations.  
  - **API Methods**:  
    - `createConversation`:  
      - **Input**:  
        - `userId` (string): ID of the user initiating the conversation.  
        - `context` (object): Metadata for the conversation.  
      - **Output**:  
        - Newly created conversation ID and metadata.  
      - **Errors**:  
        - Missing user ID or invalid context object.  
    - `updateConversation`:  
      - **Input**:  
        - `conversationId` (string): ID of the conversation to update.  
        - `updates` (object): Fields to update in the conversation.  
      - **Output**:  
        - Updated conversation object.  
      - **Errors**:  
        - Invalid conversation ID or update fields.  


#### `services/form-agent-matcher.ts`
- **Description**: Matches users to the most suitable agent based on provided form data and predefined matching criteria.
- **What Developers Need to Send**:
  - **Method Call**: `matchAgent(formData)`
  - **Parameters**:
    - `formData` (object): Contains user inputs, preferences, and context information.
      - Example:
        ```json
        {
          "userId": "123",
          "preferences": {
            "language": "English",
            "specialty": "Sales"
          }
        }
        ```
- **Response**:
  - **Success**:
    - Returns the matched agent's details:
      ```json
      {
        "agentId": "456",
        "name": "Jane Doe",
        "specialty": "Sales",
        "language": "English"
      }
      ```
  - **Errors**:
    - Throws validation errors if `formData` is incomplete or invalid.
    - Returns a `404 Not Found` error if no suitable agent is found.
- **Supporting Files**:
  - `services/agent-context.ts`: Retrieves agent details.
  - `services/context-gatherer.ts`: Collects user context for matching.
  - `types/global.d.ts`: Defines types for agent and form data.

---

#### `pages/api/conversations/analyze.ts`
- **Description**: Analyzes conversation data to extract actionable insights and updates relevant milestones or funnels.
- **What Developers Need to Send**:
  - **HTTP Method**: `POST`
  - **Payload**:
    - `conversationId` (string): Unique identifier of the conversation to analyze.
    - `userId` (string): ID of the user initiating the analysis.
    - Example:
      ```json
      {
        "conversationId": "789",
        "userId": "123"
      }
      ```
- **Response**:
  - **Success**:
    - `200 OK`: JSON object containing extracted insights.
      ```json
      {
        "milestones": [
          {
            "milestoneId": "101",
            "status": "completed",
            "timestamp": "2025-01-18T10:00:00Z"
          }
        ]
      }
      ```
  - **Errors**:
    - `400 Bad Request`: Missing or invalid payload parameters.
    - `500 Internal Server Error`: Failure during analysis processing.
- **Supporting Files**:
  - `services/conversation-analyzer.ts`: Extracts insights from conversation data.
  - `services/updateFunnelProgress.ts`: Updates progress based on analysis results.
  - `lib/prisma.ts`: Handles database operations for conversations and milestones.


- **`src/lib/llm/llm-handler.ts`**  
  - **Description**:  
    Handles LLM interaction and logs diverse response types (text, images).  
  - **API Methods**:  
    - `handleLLMInteraction`:  
      - **Input**:  
        - `prompt` (string): The prompt to be sent to the LLM.  
        - `context` (object): Additional metadata for the LLM.  
      - **Output**:  
        - Response object containing LLM's output and response type (text, image, etc.).  
      - **Errors**:  
        - Invalid prompt or unsupported response type.  
  - **Dependencies**:  
    - `src/lib/llm/llm-client.ts`: LLM API integration.  
    - `src/utils/logger.ts`: Structured logging.

- **`pages/api/conversations/click.ts`**  
  - **Description**:  
    Manages conversation click actions, including agent initialization and payload preparation.  
  - **API Methods**:  
    - `handleClick`:  
      - **Input**:  
        - `conversationId` (string): The ID of the clicked conversation.  
        - `action` (string): The specific action to execute (e.g., initialize agent).  
      - **Output**:  
        - Action response based on the click event.  
      - **Errors**:  
        - Invalid action or conversation ID.  


---




## 3. Dashboard Analytics

### Narrative
Provides actionable analytics summarizing funnel progress, tool usage, and recent activity for team and individual monitoring.

---

### Core Files

#### `services/dashboard-analytics.ts`
- **Description**:  
  Aggregates and summarizes data for dashboard display, providing actionable insights to users and teams.

- **API Methods**:  
  - `getFunnelProgressAnalytics`:  
    - **Input**:  
      - `userId` (string): The ID of the user requesting analytics.  
      - `teamId` (string, optional): The ID of the team for team-wide analytics.  
    - **Output**:  
      - Funnel progress metrics, including completion rates and milestones achieved.  
    - **Errors**:  
      - Invalid user ID or insufficient permissions.  

  - `getToolUsageAnalytics`:  
    - **Input**:  
      - `userId` (string): The ID of the user requesting analytics.  
      - `teamId` (string, optional): The ID of the team for team-wide usage metrics.  
    - **Output**:  
      - Usage statistics for tools, including frequency and effectiveness scores.  
    - **Errors**:  
      - Missing or invalid user/team ID.  

  - `getRecentActivity`:  
    - **Input**:  
      - `userId` (string): The ID of the user requesting analytics.  
      - `teamId` (string, optional): The ID of the team for team-wide activity logs.  
    - **Output**:  
      - List of recent activities (e.g., completed milestones, interactions).  
    - **Errors**:  
      - Unauthorized access or invalid ID.  

- **Supporting Files**:  
  - `lib/prisma.ts`: Handles database connections for retrieving analytics data.  
  - `services/user-progress.ts`: Provides user progress data for funnel analytics.  
  - `types/global.d.ts`: Defines the type structure for analytics data and responses.  

- **UI Requirements**:  
  - Dashboard widgets for:  
    - Funnel progress metrics (e.g., percentage complete).  
    - Tool usage insights with graphical representations.  
    - Recent activity logs for user/team actions.  
  - Filters for time ranges (e.g., weekly, monthly).  
  - Export options for data summaries.  

---




## 4. Admin Tools

**Narrative**  
Supports administrative oversight by managing agents, testing interactions, and tracking conversation effectiveness.

### Core Files

#### `services/admin/agent-manager.ts`
- **Description**: Manages agent definitions, configurations, and prompts.
- **API Methods**:
  - `createAgent`
    - **Input**: `AgentDefinition` object with properties like name, role, category, and specialties.
    - **Output**: Created agent object with a unique ID.
    - **Errors**: Throws if the provided definition is invalid.
  - `updateAgent`
    - **Input**: Agent ID and updated `AgentDefinition` object.
    - **Output**: Updated agent object.
    - **Errors**: Throws if the agent is not found or the update fails.
- **UI Requirements**:
  - Form for agent creation and updates.
  - Validation feedback for required fields.


#### `services/admin/agent-tester.ts`
- **Description**: Tests agent interactions for quality assurance.
- **API Methods**:
  - `simulateConversation`
    - **Input**: Agent ID and sample conversation data.
    - **Output**: Simulated conversation results with evaluation metrics.
    - **Errors**: Throws if the agent or conversation data is invalid.
- **UI Requirements**:
  - Interface to input test scenarios and display results.
  - Metrics visualization for agent performance.


#### `services/admin/conversation-tracker.ts`
- **Description**: Tracks and analyzes conversation metrics for administrative insights.
- **API Methods**:
  - `getConversationMetrics`
    - **Input**: Query parameters such as date range and agent ID.
    - **Output**: Metrics including total conversations, average message count, and resolution rate.
    - **Errors**: Throws if the query parameters are invalid.
- **UI Requirements**:
  - Dashboard for conversation metrics.
  - Filters for date range, agent ID, and other parameters.


#### `services/admin/prompt-manager.ts`
- **Description**: Manages prompts for agents, including generation, versioning, and updates.
- **API Methods**:
  - `createPrompt`
    - **Input**: Prompt details, including agent ID and prompt text.
    - **Output**: Created prompt object with version history.
    - **Errors**: Throws if prompt creation fails.
  - `updatePrompt`
    - **Input**: Prompt ID and updated text.
    - **Output**: Updated prompt object.
    - **Errors**: Throws if the prompt is not found.
- **UI Requirements**:
  - Prompt editor with version history display.
  - Validation for prompt text length and format.


#### `services/admin/sentry-service.js`
- **Description**: Interfaces with Sentry to fetch issues and performance metrics.
- **API Methods**:
  - `fetchSentryIssues`
    - **Input**: `projectSlug` and `organizationSlug`.
    - **Output**: List of Sentry issues for the specified project.
    - **Errors**: Throws if the project or organization slug is invalid.
  - `fetchPerformanceMetrics`
    - **Input**: `projectSlug` and `organizationSlug`.
    - **Output**: Performance metrics for the specified project.
    - **Errors**: Throws if fetching metrics fails.


#### `pages/api/admin/sentry.js`
- **Description**: Handles API requests for Sentry data.
- **Input**: Query parameters including `projectSlug`, `organizationSlug`, and `type` (e.g., "issues" or "performance").
- **Output**:
  - Issues or performance metrics from Sentry, depending on the `type` parameter.
  - Error messages if the input parameters are invalid or if an unexpected error occurs.
- **Example**:
  ```json
  GET /api/admin/sentry?projectSlug=my-project&organizationSlug=my-org&type=issues
  Response: [
    { "id": "1", "title": "Error A", "details": "Details of Error A" },
    { "id": "2", "title": "Error B", "details": "Details of Error B" }
  ]

---



## 5. Website Scraping and Analysis

**Narrative**  
Automates website scraping, analyzes content using LLMs, and provides real-time updates with robust validation and extraction workflows.

---

### Core Files

#### Scraping Workflow

##### **`src/types/api/website-scrape/start.ts`**
- **Description**: Initializes scraping jobs and validates input data.
- **Input**: 
  - `url`: The website URL to scrape.
  - `options`: Additional scraping configurations (e.g., depth, filters).
- **Output**: 
  - Scraping job details, including job ID, status, and configurations.
- **Errors**:
  - Invalid URL.
  - Configuration conflicts.
- **Supporting Files**:
  - `src/lib/scraping/job-manager.ts`: Manages job queues and progress.
  - `src/lib/website-validator.ts`: Validates website accessibility.

##### **`src/types/api/website-scrape/status.ts`**
- **Description**: Tracks and reports the progress of scraping jobs.
- **Input**:
  - `jobId`: Unique identifier of the scraping job.
- **Output**:
  - Job progress, including percentage complete and errors (if any).
- **Errors**:
  - Missing or invalid `jobId`.
- **Supporting Files**:
  - `src/lib/websocket/scrape-progress.ts`: Handles real-time updates.

##### **`src/types/api/website-scrape/progress.ts`**
- **Description**: Retrieves paginated scraping results, including page metadata.
- **Input**:
  - `jobId`: Identifier for the scraping job.
  - Pagination parameters (`page`, `size`).
- **Output**:
  - Paginated list of scraped pages with metadata (e.g., titles, URLs).
- **Errors**:
  - Missing or invalid `jobId`.

---

### Utilities

##### **`src/lib/scraping/crawler.ts`**
- **Description**: Handles metadata extraction and link discovery.
- **Input**:
  - `url`: Website URL to crawl.
  - `options`: Crawler-specific configurations.
- **Output**:
  - Discovered links and extracted metadata.
- **Errors**:
  - Access issues (e.g., blocked by `robots.txt`).
  - Invalid configurations.

##### **`src/lib/scraping/job-manager.ts`**
- **Description**: Manages scraping job queues and progress tracking.
- **Input**:
  - `jobDetails`: Configuration and metadata for the job.
- **Output**:
  - Job status updates and error tracking.
- **Errors**:
  - Invalid job details or unsupported configurations.

##### **`src/lib/website-validator.ts`**
- **Description**: Validates website accessibility.
- **Input**:
  - `url`: The website URL to validate.
- **Output**:
  - Validation result (accessible or not) and compliance details.
- **Errors**:
  - Invalid URL or inaccessible website.

---

### Analysis

##### **`src/services/website-analysis.service.ts`**
- **Description**: Processes scraped data using LLMs for insights.
- **Input**:
  - `scrapedData`: Content retrieved from the scraping process.
  - `analysisConfig`: Configuration for the analysis (e.g., specific metrics or areas of interest).
- **Output**:
  - Analyzed insights, including structured findings and actionable recommendations.
- **Errors**:
  - Invalid scraped data or unsupported configurations.


---

#### `src/types/api/website-scraper.types.ts`
- **Description**: Defines the type structures for managing website scraping configurations, results, and errors in the scraping process.
- **Core Type Definitions**:
  - **`ScrapingJobConfig`**:
    - Represents the configuration for a scraping job.
    - **Properties**:
      - `jobId` (string): Unique identifier for the scraping job.
      - `url` (string): The website URL to be scraped.
      - `depth` (number): Depth of the scrape for traversing linked pages.
      - `filters` (object): Optional filters for scraping (e.g., file types, content categories).
      - Example:
        ```typescript
        {
          jobId: "job_123",
          url: "https://example.com",
          depth: 2,
          filters: { includeImages: true }
        }
        ```

  - **`ScrapingResult`**:
    - Represents the result of a scraping job.
    - **Properties**:
      - `jobId` (string): Unique identifier for the scraping job.
      - `pagesScraped` (number): Total number of pages scraped.
      - `data` (array): Array of scraped page metadata.
        - Each item contains:
          - `url` (string): URL of the scraped page.
          - `content` (string): Extracted content from the page.
      - Example:
        ```typescript
        {
          jobId: "job_123",
          pagesScraped: 10,
          data: [
            { url: "https://example.com/page1", content: "<html>...</html>" },
            { url: "https://example.com/page2", content: "<html>...</html>" }
          ]
        }
        ```

  - **`ScrapingError`**:
    - Defines the structure for errors encountered during the scraping process.
    - **Properties**:
      - `errorCode` (string): Code representing the type of error (e.g., "INVALID_URL").
      - `message` (string): Detailed error message.
      - `timestamp` (string): Timestamp when the error occurred.
      - Example:
        ```typescript
        {
          errorCode: "INVALID_URL",
          message: "The provided URL is not valid.",
          timestamp: "2025-01-18T12:00:00Z"
        }
        ```

  - **`ScrapingJobStatus`**:
    - Represents the status of an ongoing scraping job.
    - **Properties**:
      - `jobId` (string): Unique identifier for the scraping job.
      - `status` (string): Current status of the job (e.g., "IN_PROGRESS", "COMPLETED").
      - `progress` (number): Percentage of the job completed.
      - Example:
        ```typescript
        {
          jobId: "job_123",
          status: "IN_PROGRESS",
          progress: 50
        }
        ```

- **Usage**:
  - Used by scraping-related services and APIs to validate input and structure responses.
  - Enables consistent data handling for job configurations, results, and errors.
- **Supporting Files**:
  - `src/lib/scraping/job-manager.ts`: Manages job queues and uses these types for configuration.
  - `src/lib/scraping/crawler.ts`: Implements the scraper logic using `ScrapingJobConfig` and `ScrapingResult`.
  - `src/lib/website-validator.ts`: Validates input URLs and uses `ScrapingError` for error reporting.



----

## 6. Adaptive and Contextual Intelligence

**Narrative**  
Enhances user experience through personalized content, recommendations, and insights based on contextual data and funnel performance.

---

### Core Files

#### `src/services/rag/rag-context.service.ts`
- **Description**: Aggregates historical data to enrich interactions and improve agent responses.
- **API Methods**:
  - `getContextData`: 
    - **Input**: Historical data filters (`userId`, `funnelId`, `milestoneId`).
    - **Returns**: Structured contextual data for agent interactions.
    - **Errors**: Throws if required historical data is missing.
- **Dependencies**:
  - `src/lib/llm/llm-client.ts`: For LLM-based data enrichment.
  - `src/utils/logger.ts`: Logging utility.
  - `src/lib/prisma.ts`: Database operations.

---

#### `src/services/adaptation/content-adaptation.service.ts`
- **Description**: Dynamically adjusts recommendations, resources, and content based on user context and funnel progress.
- **API Methods**:
  - `adaptContent`: 
    - **Input**: User's progress data (`funnelId`, `userId`, `engagementHistory`).
    - **Returns**: Recommended content tailored to the user.
    - **Errors**: Throws if insufficient context is provided.
- **Dependencies**:
  - `src/services/rag/rag-context.service.ts`: Provides contextual data.
  - `src/lib/llm/llm-client.ts`: Content analysis and generation.
  - `src/utils/logger.ts`: Logs adjustments for debugging.
  - `src/lib/prisma.ts`: Accesses user engagement data.

---

#### `src/services/insights/user-insight-aggregation.service.ts`
- **Description**: Creates comprehensive user profiles and insights by aggregating data from various sources.
- **API Methods**:
  - `aggregateUserInsights`: 
    - **Input**: User identifiers and relevant datasets (`userId`, `funnelData`, `interactionLogs`).
    - **Returns**: Detailed user insights, including engagement metrics and behavioral trends.
    - **Errors**: Throws for incomplete or corrupted input data.
- **Dependencies**:
  - `src/services/rag/rag-context.service.ts`: For historical context.
  - `src/services/adaptation/content-adaptation.service.ts`: For preference data.
  - `src/lib/llm/llm-client.ts`: Generates insight summaries.
  - `src/utils/logger.ts`: Logs aggregation processes.
  - `src/lib/prisma.ts`: Data fetching and aggregation.

---

#### `src/services/intelligence/cross-funnel.service.ts`
- **Description**: Optimizes user journeys by analyzing dependencies and patterns across multiple funnels.
- **API Methods**:
  - `analyzeCrossFunnelPatterns`: 
    - **Input**: Multi-funnel progress data (`funnelId[]`, `userId`).
    - **Returns**: Cross-funnel insights, including identified blockers and success pathways.
    - **Errors**: Throws if funnel dependency data is incomplete.
- **Dependencies**:
  - `src/services/insights/user-insight-aggregation.service.ts`: Provides aggregated user data.
  - `src/services/rag/rag-context.service.ts`: Supplies historical context for analysis.
  - `src/lib/llm/llm-client.ts`: Pattern recognition and dependency mapping.
  - `src/utils/logger.ts`: Logs cross-funnel analyses.
  - `src/lib/prisma.ts`: Accesses funnel-related data.


---




## 7. Shared Utilities and Type Definitions

**Narrative**  
Provides reusable components, shared utilities, and centralized type definitions for system consistency and efficiency.

### Core Files

#### `src/types/api/pages.ts`
- **Description**: Defines type structures for API responses and requests related to page operations.
- **Core Type Definitions**:
  - **`PageData`**:
    - Represents the structure of a single page object.
    - **Properties**:
      - `id` (string): Unique identifier for the page.
      - `title` (string): Title of the page.
      - `url` (string): URL of the page.
      - `metadata` (Record<string, string>): Additional metadata about the page.
    - **Example**:
      ```typescript
      {
        id: "page_123",
        title: "Example Page",
        url: "https://example.com",
        metadata: { author: "John Doe", category: "Tech" }
      }
      ```

  - **`PageRequest`**:
    - Defines the payload structure for API requests involving page creation or updates.
    - **Properties**:
      - `title` (string): Title of the page.
      - `url` (string): URL of the page.
      - `metadata` (optional, Record<string, string>): Additional metadata about the page.
    - **Example**:
      ```typescript
      {
        title: "New Page",
        url: "https://example.com/new",
        metadata: { category: "Science" }
      }
      ```

  - **`PageResponse`**:
    - Represents the API response structure for a single page operation.
    - **Properties**:
      - `success` (boolean): Indicates whether the operation was successful.
      - `page` (PageData): Contains the page details if the operation is successful.
    - **Example**:
      ```typescript
      {
        success: true,
        page: {
          id: "page_123",
          title: "Example Page",
          url: "https://example.com",
          metadata: { author: "John Doe", category: "Tech" }
        }
      }
      ```

- **Usage**:
  - Used to ensure type safety and consistency in handling page-related API operations.
  - Supports structured communication between front-end and back-end systems.

- **Supporting Files**:
  - `services/page-manager.ts`: Handles logic for creating and managing pages.
  - `api/routes/pages.ts`: API endpoints for page-related operations.


#### Database and Error Handling
- **`lib/prisma.ts`**  
  Singleton Prisma client for optimized database operations.


### `lib/db-helpers.ts`

- **Description**:  
  Provides reusable utilities for database operations, simplifying common tasks like queries, updates, and transaction management.

- **Core Methods**:  

  - **`runQuery`**:  
    Executes a SQL query and returns the results.  
    - **Input**:  
      - `query` (string): SQL query string to execute.  
      - `params` (array, optional): Query parameters for prepared statements.  
    - **Output**: Promise resolving to the query results.  
    - **Example**:  
      ```typescript
      const results = await runQuery('SELECT * FROM users WHERE id = ?', [userId]);
      ```

  - **`beginTransaction`**:  
    Starts a database transaction.  
    - **Output**: Returns a transaction object for further operations.  
    - **Example**:  
      ```typescript
      const transaction = await beginTransaction();
      ```

  - **`commitTransaction`**:  
    Commits an open transaction to the database.  
    - **Input**:  
      - `transaction` (object): The transaction object to commit.  
    - **Output**: Confirms transaction commit.  
    - **Example**:  
      ```typescript
      await commitTransaction(transaction);
      ```

  - **`rollbackTransaction`**:  
    Rolls back an open transaction in case of errors.  
    - **Input**:  
      - `transaction` (object): The transaction object to roll back.  
    - **Output**: Confirms transaction rollback.  
    - **Example**:  
      ```typescript
      await rollbackTransaction(transaction);
      ```

- **Supporting Files**:  
  - `lib/prisma.ts`: Integrates with the Prisma client for database access.



- **`lib/prisma-errors.ts`**  
  Standardized error handling for Prisma.


#### Types and Definitions
- **`types/global.d.ts`**  
  Global type definitions for Prisma models and common operations.


- **`types/prisma.ts`**  
  Prisma-specific utilities and type guards.

### `src/utils/logger.ts`

- **Description**:  
  Provides a structured and standardized logging utility for debugging, tracking events, and recording system behavior.

- **Core Methods**:  

  - **`logInfo`**:  
    Logs informational messages.  
    - **Input**:  
      - `message` (string): The message to log.  
      - `context` (object, optional): Additional metadata or context for the log.  
    - **Output**: Logs the message to the console or configured output.  
    - **Example**:  
      ```typescript
      logInfo('User login successful', { userId: '123' });
      ```

  - **`logWarning`**:  
    Logs warning messages to indicate potential issues.  
    - **Input**:  
      - `message` (string): The warning message.  
      - `context` (object, optional): Metadata or context for the warning.  
    - **Output**: Logs the warning message to the console or configured output.  
    - **Example**:  
      ```typescript
      logWarning('Memory usage is high', { usage: '85%' });
      ```

  - **`logError`**:  
    Logs error messages with stack traces for debugging.  
    - **Input**:  
      - `error` (Error | string): The error object or message.  
      - `context` (object, optional): Metadata or context for the error.  
    - **Output**: Logs the error message and stack trace to the console or configured output.  
    - **Example**:  
      ```typescript
      logError(new Error('Database connection failed'), { retry: true });
      ```

- **Supporting Files**:  
  - None required; integrates directly with the application's logging configuration.

--

#### `src/lib/api-utils.ts`
- **Description**: Provides utility functions for handling common API operations such as pagination, error handling, and response formatting.
- **Core Utility Functions**:
  - **`formatApiResponse`**:
    - Formats a standardized API response object.
    - **Parameters**:
      - `data` (any): The main content or data of the response.
      - `message` (optional, string): An optional message for the response.
      - `success` (optional, boolean): Indicates if the operation was successful (default: `true`).
    - **Returns**:
      - A structured response object.
    - **Example**:
      ```typescript
      formatApiResponse({ id: 1, name: "Example" }, "Operation successful");
      // Output:
      {
        success: true,
        message: "Operation successful",
        data: { id: 1, name: "Example" }
      }
      ```

  - **`handleApiError`**:
    - Handles errors during API requests and formats them into a standard response.
    - **Parameters**:
      - `error` (Error): The error object to be processed.
    - **Returns**:
      - A standardized error response object.
    - **Example**:
      ```typescript
      handleApiError(new Error("Invalid request"));
      // Output:
      {
        success: false,
        message: "Invalid request",
        error: {
          name: "Error",
          message: "Invalid request"
        }
      }
      ```

  - **`paginate`**:
    - Implements pagination logic for API data.
    - **Parameters**:
      - `items` (array): Array of items to paginate.
      - `page` (number): Current page number.
      - `pageSize` (number): Number of items per page.
    - **Returns**:
      - Paginated data including the current page, total pages, and items on the current page.
    - **Example**:
      ```typescript
      paginate([1, 2, 3, 4, 5], 1, 2);
      // Output:
      {
        currentPage: 1,
        totalPages: 3,
        items: [1, 2]
      }
      ```

  - **`validateRequestParams`**:
    - Validates required request parameters.
    - **Parameters**:
      - `params` (object): Object containing request parameters.
      - `requiredFields` (array of strings): List of required field names.
    - **Throws**:
      - An error if any required field is missing or invalid.
    - **Example**:
      ```typescript
      validateRequestParams({ userId: 123 }, ["userId"]);
      // No error thrown

      validateRequestParams({}, ["userId"]);
      // Throws: Error("Missing required parameter: userId")
      ```

- **Usage**:
  - Ensures consistent handling of API responses and error messaging.
  - Provides reusable logic for pagination and parameter validation.

- **Supporting Files**:
  - `api/routes`: Multiple API route files use these utilities for standardization.
  - `src/utils/logger.ts`: Logs errors and important events during API calls.


---





### 8. Not Diamond Routing

#### Service Interfaces

- **`src/services/routing/interfaces/router-config.interface.ts`**
Defines the contract for managing router configurations. Handles how different task types (blog, image, code) map to LLM providers.

Input: Configuration data (taskType, provider, model, etc.)
Output: Router configuration objects
Used by: router-config.service.ts


- **`src/services/routing/interfaces/routing-preference.interface.ts`**
Defines the contract for tenant-specific routing preferences.

Input: Tenant preferences for routing
Output: Preference configuration objects
Used by: tenant customization features


- **`src/services/routing/interfaces/not-diamond.interface.ts`**
Defines the contract for Not Diamond API integration.

Input: Content for analysis, performance metrics
Output: Routing recommendations
Used by: not-diamond.service.ts



#### Not Diamond:Service Implementations

- **`src/services/routing/implementations/router-config.service.ts`**
Implements router configuration management using Prisma.

Input: CRUD operations for routing configs
Output: Stored/retrieved configurations
Dependencies: Prisma, config.interface.ts


- **`src/services/routing/implementations/not-diamond.service.ts`**
Implements Not Diamond API integration.

Input: Content to analyze, performance data
Output: API responses, routing suggestions
Dependencies: not-diamond.interface.ts


- **`src/services/routing/implementations/routing-analyzer.service.ts`**
Analyzes content and determines optimal routing paths.

Input: Content, task type, tenant ID
Output: Routing decisions with reasoning
Dependencies: not-diamond.service.ts, router-config.service.ts


- **`src/services/routing/implementations/routing-history.service.ts`**
Manages routing decision history and analytics.

Input: Routing decisions, queries for history
Output: Historical data, analytics
Dependencies: Prisma



#### Not Diamond:API Endpoints

- **`src/pages/api/routing/analyze.ts`**
Endpoint for content analysis and routing recommendations.

Input: POST with content, taskType, tenantId
Output: Routing recommendation
Dependencies: routing-analyzer.service.ts


- **`src/pages/api/routing/config.ts`**
CRUD endpoints for router configurations.

Input: Configuration CRUD operations
Output: Success/failure responses
Dependencies: router-config.service.ts



#### Not Diamond:Validation and Error Handling

- **`src/services/routing/validation/api-types.ts`**
Zod schemas for API request/response validation.

Used by: API endpoints
Dependencies: zod library


- **`src/services/routing/validation/error-types.ts`**
Custom error classes for the routing system.

Used by: All services and endpoints
Provides: Structured error handling



#### Not Diamond:Infrastructure

- **`src/lib/monitoring/routing-monitor.ts`**
Monitors system health and performance.

Input: System metrics, errors
Output: Health status, alerts
Used by: All services


- **`src/lib/cache/routing-cache.ts
Caches routing configurations and capabilities.

Input: Cache operations (get/set/invalidate)
Output: Cached data
Dependencies: Redis



#### Not Diamond: Middleware and Utilities

- **`src/lib/api-middleware/index.ts`**
Authentication and request processing middleware.

Input: API requests
Output: Processed requests
Used by: API endpoints


- **`src/lib/api-utils/index.ts`**
Common API utility functions.

Provides: Response formatting, pagination
Used by: API endpoints



#### Not Diamond: Configuration

- **`src/config/routing.ts`**
Central configuration for the routing system.

Provides: System constants, defaults
Used by: All services



#### Not Diamond: Service Factory

- **`src/services/routing/index.ts`**
Initializes and manages service instances.

Provides: Service singletons
Used by: API endpoints
Dependencies: All service implementations



#### Not Diamond: Logical Flow

Request enters through API endpoint
Middleware processes request
Service factory provides needed services
Analyzer service determines routing
Not Diamond service provides recommendations
Router config service applies tenant preferences
History service records decision
Monitor tracks performance
Cache improves subsequent requests


## 9. Team Highlights and Insights

**Narrative**  
Provides intelligent and contextual insights into team progress, blockers, and recommendations by leveraging aggregated data and advanced LLM analysis. The system ensures personalized highlights for teams, drawn from multiple data sources like funnels, conversations, and tool usage.

---

### Core Files

#### `src/services/team/highlight-data-aggregator.ts`
- **Description**: Aggregates data from various sources such as funnels, conversations, and resources for team insights.
- **API Methods**:
  - `aggregateData`:
    - **Input**: 
      - `teamId` (string): The team ID for which data is being aggregated.
      - Optional filters for data sources (e.g., milestones, conversations).
    - **Returns**: Aggregated data from all sources, ready for analysis.
    - **Errors**: Throws errors for invalid team IDs or inaccessible data sources.
- **Dependencies**:
  - `src/services/funnel-progress.ts`: Fetches funnel progress data.
  - `src/services/conversation-intelligence.ts`: Analyzes conversation insights.
  - `src/services/tool-progress.ts`: Tracks tool usage metrics.
  - `src/lib/prisma.ts`: Manages database interactions.
  - `src/utils/logger.ts`: Logs operations for debugging and traceability.

---

#### `src/services/team/highlight-generator.ts`
- **Description**: Generates actionable insights and highlights using LLMs, based on aggregated data.
- **API Methods**:
  - `generateHighlights`:
    - **Input**: Aggregated data from the `highlight-data-aggregator`.
    - **Returns**: A list of highlights with categorized messages (e.g., achievements, blockers, recommendations).
    - **Errors**: Throws errors for invalid or incomplete input data.
- **Dependencies**:
  - `src/lib/llm/llm-handler.ts`: Handles interactions with the LLM.
  - `src/utils/logger.ts`: Tracks LLM interactions and errors.

---

#### `src/services/team/highlight-service.ts`
- **Description**: Orchestrates data aggregation and LLM-driven generation to produce team highlights.
- **API Methods**:
  - `getTeamHighlights`:
    - **Input**: 
      - `teamId` (string): The team ID for which highlights are requested.
    - **Returns**: A structured response with actionable insights for the team.
    - **Errors**: Throws errors for invalid team IDs or processing failures.
- **Dependencies**:
  - `src/services/team/highlight-data-aggregator.ts`: Aggregates data from various sources.
  - `src/services/team/highlight-generator.ts`: Generates highlights from aggregated data.
  - `src/utils/logger.ts`: Logs the service flow for debugging.

---

#### `src/pages/api/team/highlights.ts`
- **Description**: API endpoint to provide highlights for a specific team.
- **API Methods**:
  - `GET /api/team/highlights`:
    - **Query Parameters**:
      - `teamId` (string): The ID of the team requesting highlights.
    - **Response**:
      - **Success**:
        ```json
        {
          "success": true,
          "highlights": [
            { "type": "achievement", "message": "Your team completed 5 milestones this week." },
            { "type": "blocker", "message": "3 members are stuck at milestone X." },
            { "type": "recommendation", "message": "Encourage more usage of Tool Y." }
          ]
        }
        ```
      - **Errors**:
        - `400 Bad Request`: Missing or invalid `teamId`.
        - `500 Internal Server Error`: Failure during data aggregation or highlight generation.
- **Dependencies**:
  - `src/services/team/highlight-service.ts`: Manages the highlight generation process.
  - `src/utils/logger.ts`: Logs API requests and errors.



#### Team Collaboration

##### `src/pages/api/team/assignments.ts`
- **Description**: Manages team task assignments and progress tracking across team members.
- **API Methods**:
  - `POST /api/team/assignments`:
    - **Input**:
      ```json
      {
        "teamId": "string",
        "assigneeId": "string",
        "funnelId": "string",
        "milestoneId": "string",
        "title": "string",
        "description": "string",
        "dueDate": "ISO-8601 date"
      }
      ```
    - **Returns**: Created assignment with insights and suggestions.
    - **Errors**: Insufficient permissions, invalid data.
  - `PUT /api/team/assignments`:
    - **Input**:
      ```json
      {
        "assignmentId": "string",
        "status": "string",
        "progress": "number",
        "notes": "string"
      }
      ```
    - **Returns**: Updated assignment status.
    - **Errors**: Assignment not found, invalid update.
  - `GET /api/team/assignments`:
    - **Query Parameters**:
      - `teamId` (string): Team identifier
      - `userId` (string, optional): Filter by assignee
      - `status` (string, optional): Filter by status
      - `priority` (string, optional): Filter by priority
    - **Returns**: List of assignments with related data.
- **Dependencies**:
  - `services/team/assignment-manager.ts`: Assignment logic
  - `services/notifications.ts`: Team notifications
  - Database Models: Team, TeamMember, FunnelProgress




##### `src/pages/api/team/collaboration.ts`
- **Description**: Manages team collaboration settings and communication preferences.
- **API Methods**:
  - `GET /api/team/collaboration`:
    - **Query Parameters**:
      - `teamId` (string): Team to fetch settings for
    - **Returns**: Team collaboration settings and member preferences.
    - **Errors**: Team not found.
  - `PUT /api/team/collaboration`:
    - **Input**:
      ```json
      {
        "teamId": "string",
        "settings": {
          "notifications": Array<NotificationPreference>,
          "visibility": VisibilitySettings,
          "collaboration": CollaborationPreferences
        }
      }
      ```
    - **Returns**: Updated team settings.
    - **Errors**: Insufficient permissions, invalid settings.
- **Dependencies**:
  - `services/team/settings-manager.ts`: Team settings management
  - `services/notifications.ts`: Notification preferences
  - Database Models: Team, TeamMember, UserSettings



##### `src/pages/api/team/permissions.ts`
- **Description**: Handles role-based access control and permission management.
- **API Methods**:
  - `GET /api/team/permissions`:
    - **Query Parameters**:
      - `teamId` (string): Team identifier
      - `userId` (string, optional): Specific user permissions
    - **Returns**: Team member permissions and roles.
    - **Errors**: Invalid team or user ID.
  - `PUT /api/team/permissions`:
    - **Input**:
      ```json
      {
        "teamId": "string",
        "userId": "string",
        "role": "string",
        "requesterId": "string"
      }
      ```
    - **Returns**: Updated member permissions.
    - **Errors**: Insufficient permissions, invalid role.
- **Dependencies**:
  - `services/team/rbac.ts`: Permission management
  - `services/audit-logger.ts`: Permission change logging
  - Database Models: Team, TeamMember, Role

### Integration Points

#### Database Relationships
- Team members to assignments
- Teams to collaboration settings
- Users to notification preferences
- Roles to permissions

#### External Services
- Not Diamond Router: LLM-based assignment insights
- Notification System: Team updates
- Audit Logger: Permission changes


---



## 10. HubSpot Integration Module

**Narrative**  
Provides comprehensive integration with HubSpot's CRM and Marketing APIs, including OAuth authentication, data synchronization, and intelligent analysis using LLMs.

### Core Components

#### Authentication and Connection Management

##### `src/services/integrations/hubspot/hubspot-auth.ts`
- **Description**: Manages HubSpot OAuth flow and token lifecycle.
- **Core Functions**:
  - **`getHubSpotAuthUrl`**:
    - Generates OAuth URL for initiating HubSpot connection.
    - **Parameters**:
      - `userId` (string): User initiating the connection
      - `teamId` (string, optional): Team ID if applicable
    - **Returns**: URL string for OAuth flow

  - **`handleHubSpotCallback`**:
    - Processes OAuth callback and token exchange.
    - **Parameters**:
      - `code` (string): Authorization code from HubSpot
      - `state` (string): Contains userId and teamId
    - **Example**:
      ```typescript
      await handleHubSpotCallback(authCode, JSON.stringify({ userId, teamId }));
      ```

##### `src/services/integrations/hubspot/hubspot-connection-service.ts`
- **Description**: Manages integration configurations and connection status.
- **Core Functions**:
  - **`connectHubSpotIntegration`**: Establishes new integration connection
  - **`disconnectHubSpotIntegration`**: Disables existing integration
  - **`validateHubSpotToken`**: Checks and refreshes token status



#### Data Synchronization

##### `src/services/integrations/hubspot/hubspot-sync-service.ts`
- **Description**: Orchestrates data synchronization between HubSpot and local database.
- **Key Features**:
  - Synchronizes CRM and marketing data
  - Handles error recovery and logging
  - Maintains sync status and history

##### `src/services/integrations/hubspot/hubspot-crm-client.ts`
- **Description**: Handles interaction with HubSpot's CRM APIs.
- **Core Functions**:
  - **`syncHubSpotContacts`**: Syncs contact data
  - **`syncHubSpotDeals`**: Syncs deal data
  - **`syncHubSpotCompanies`**: Syncs company data

##### `src/services/integrations/hubspot/hubspot-marketing-client.ts`
- **Description**: Manages HubSpot Marketing API interactions.
- **Core Functions**:
  - **`fetchCampaigns`**: Retrieves campaign data
  - **`fetchCampaignPerformance`**: Gets performance metrics
  - **`fetchCampaignContent`**: Retrieves campaign content

#### Intelligent Analysis

##### `src/services/integrations/hubspot/hubspot-marketing-analysis.ts`
- **Description**: Provides LLM-based analysis of marketing data.
- **Key Features**:
  - Uses Not Diamond for optimal LLM routing
  - Analyzes campaign performance
  - Generates actionable insights


  ##### `src/services/integrations/hubspot/hubspot-logs-service.ts`
- **Description**: Manages integration logging and monitoring.
- **Core Functions**:
  - **`logIntegrationEvent`**: Records integration events
  - **`getIntegrationLogs`**: Retrieves log history
  - **`formatIntegrationLogs`**: Formats logs for API responses

### API Endpoints

#### OAuth Flow
- **`/api/integrations/hubspot/connect`**: Initiates OAuth connection
- **`/api/integrations/hubspot/callback`**: Handles OAuth callback

#### Data Operations
- **`/api/integrations/hubspot/sync-crm`**: Triggers CRM data sync
- **`/api/integrations/hubspot/sync-marketing`**: Triggers marketing data sync
- **`/api/integrations/hubspot/analyze-crm`**: Analyzes CRM data
- **`/api/integrations/hubspot/analyze-marketing`**: Analyzes marketing performance
- **`/api/integrations/hubspot/status`**: Checks integration status
- **`/api/integrations/hubspot/logs`**: Retrieves integration logs

### Supporting Files
- `lib/prisma.ts`: Database operations
- `utils/logger.ts`: Structured logging
- `lib/api-utils.ts`: API response handling
- `services/routing/implementations/not-diamond.service.ts`: LLM routing


## 11. Marketing Success Wheel

### Narrative
Manages the collection, analysis, and tracking of Marketing Success Wheel assessments, providing insights and recommendations for marketing strategy optimization. Integrates with funnel progress tracking and uses LLMs for dynamic analysis.

---

### Core Files

#### Assessment Management

- **`api/resources/success_wheel/submit.ts`**
  - **Description**:
    Handles submission of Marketing Success Wheel assessments and stores both raw scores and processed insights.
  - **API Methods**:
    - `submitAssessment`:
      - **Input**:
        - `userId` (string): The user submitting the assessment
        - `teamId` (string, optional): Team ID if applicable
        - `scores` (object): Assessment scores for each category
      - **Output**:
        - Created assessment record with analysis results
      - **Errors**:
        - Invalid submission data
        - Failed to store assessment
  - **Supporting Files**:
    - `services/msw/analysis.ts`: Analyzes assessment scores
    - `services/updateFunnelProgress.ts`: Updates funnel progress based on MSW

- **`api/resources/success_wheel/analyze.ts`**
  - **Description**:
    Analyzes existing MSW data using Not Diamond for optimal LLM routing.
  - **API Methods**:
    - `analyzeAssessment`:
      - **Input**:
        - `assessmentId` (string): ID of the assessment to analyze
      - **Output**:
        - Detailed analysis and recommendations
      - **Errors**:
        - Assessment not found
        - Analysis failed
  - **Supporting Files**:
    - `services/msw/analysis.ts`: Core analysis logic
    - `services/routing/implementations/not-diamond.service.ts`: LLM routing

#### History and Tracking

- **`api/resources/success_wheel/history.ts`**
  - **Description**:
    Retrieves and analyzes historical MSW assessments.
  - **API Methods**:
    - `getHistory`:
      - **Input**:
        - `userId` (string): User whose history to retrieve
        - `teamId` (string, optional): Team ID if applicable
        - `limit` (number, optional): Number of records to return
      - **Output**:
        - List of assessments with trend analysis
      - **Errors**:
        - Invalid user/team ID
  - **Supporting Files**:
    - `services/msw/trends.ts`: Analyzes assessment trends

- **`api/resources/success_wheel/reminder.ts`**
  - **Description**:
    Manages reassessment scheduling and notifications.
  - **API Methods**:
    - `scheduleReminder`:
      - **Input**:
        - `userId` (string): User to remind
        - `teamId` (string, optional): Team ID if applicable
      - **Output**:
        - Scheduled reminder details
      - **Errors**:
        - Failed to schedule reminder
  - **Supporting Files**:
    - `services/notifications.ts`: Handles notifications
    - `services/scheduler.ts`: Manages scheduling

## 12. Agent System

### Narrative
Provides intelligent agent management and routing, ensuring optimal agent selection and interaction based on context, user needs, and agent capabilities. Uses LLMs for dynamic analysis and decision-making.

---

### Core Files

#### Agent Management

- **`api/agents/match.ts`**
  - **Description**:
    Matches users with the most suitable agent using contextual analysis.
  - **API Methods**:
    - `matchAgent`:
      - **Input**:
        - `userId` (string): User needing an agent
        - `context` (object): Current context and requirements
      - **Output**:
        - Best matching agent with confidence score
      - **Errors**:
        - No suitable agent found
  - **Supporting Files**:
    - `services/agents/matcher.service.ts`: Matching logic
    - `services/routing/not-diamond.service.ts`: LLM routing

- **`api/agents/capabilities.ts`**
  - **Description**:
    Analyzes and exposes agent capabilities dynamically.
  - **API Methods**:
    - `getCapabilities`:
      - **Input**:
        - `agentId` (string): Agent to analyze
      - **Output**:
        - Detailed capability analysis
      - **Errors**:
        - Agent not found
        - Analysis failed
  - **Supporting Files**:
    - `services/agents/capability-analyzer.service.ts`: Analysis logic

#### Interaction Management

- **`api/agents/handoff.ts`**
  - **Description**:
    Manages transitions between agents with context preservation.
  - **API Methods**:
    - `initiateHandoff`:
      - **Input**:
        - `currentAgentId` (string): Current agent
        - `targetAgentId` (string): Target agent
        - `conversationId` (string): Active conversation
        - `reason` (string): Handoff reason
      - **Output**:
        - New conversation with preserved context
      - **Errors**:
        - Invalid agent IDs
        - Failed context transfer
  - **Supporting Files**:
    - `services/agents/handoff.service.ts`: Handoff logic
    - `services/conversations/context.service.ts`: Context management

### Supporting Types

#### Database Models
- **Agent**: Core agent information
- **AgentData**: Personality, skills, and knowledge data
- **AgentsDefined**: LLM-specific agent definitions
- **UserConversation**: Conversation tracking and context
- **RoutingHistory**: Agent selection and handoff history

#### Integration Points
- Not Diamond Router: Optimal LLM selection
- Conversation Analysis: Context understanding
- Funnel Progress: Agent alignment with user progress


## 13. Progress Tracking System

### Narrative
Provides comprehensive tracking and analysis of marketing journey progress, identifying blockers, suggesting next steps, and delivering actionable insights through intelligent LLM analysis. Integrates user and team progress data across all funnels and milestones to guide strategic decision-making.

---

### Core Files

#### Progress Overview

##### `pages/api/progress/overview.ts`
- **Description**: 
  Delivers comprehensive analysis of marketing journey progress across all funnels and milestones.
- **API Methods**:
  - `GET /api/progress/overview`:
    - **Input**:
      - `userId` (string): User requesting progress overview
      - `teamId` (string, optional): Team ID for team progress
    - **Output**:
      ```typescript
      {
        progress: {
          overall: number,
          byFunnel: Array<{
            funnelId: string,
            status: FunnelStatus,
            completion: number,
            insights: object
          }>
        },
        recentActivity: Array<ActivityRecord>,
        insights: ProgressInsights,
        recommendations: Array<Recommendation>
      }
      ```
    - **Errors**:
      - Invalid user/team ID
      - Failed data aggregation
  - **Supporting Files**:
    - `services/funnel-progress.ts`: Progress tracking logic
    - `services/msw/analysis.ts`: Assessment analysis
    - `services/team/highlight-generator.ts`: Progress highlights

#### Next Steps Analysis

##### `pages/api/progress/next-steps.ts`
- **Description**:
  Analyzes current progress and generates intelligent recommendations for next actions using LLM analysis.
- **API Methods**:
  - `GET /api/progress/next-steps`:
    - **Input**:
      - `userId` (string): User requesting recommendations
      - `teamId` (string, optional): Team ID for team context
    - **Output**:
      ```typescript
      {
        immediateActions: Array<ActionItem>,
        shortTermGoals: Array<GoalItem>,
        strategicRecommendations: Array<Recommendation>,
        reasoning: string,
        priorityOrder: Array<string>
      }
      ```
    - **Errors**:
      - No active funnels found
      - Analysis generation failed
  - **Supporting Files**:
    - `services/funnel-progress.ts`: Progress data
    - `services/agents/matcher.service.ts`: Agent recommendations

#### Blocker Detection

##### `pages/api/progress/blockers.ts`
- **Description**:
  Identifies and analyzes obstacles preventing progress in the marketing journey using LLM evaluation.
- **API Methods**:
  - `GET /api/progress/blockers`:
    - **Input**:
      - `userId` (string): User context for blocker analysis
      - `teamId` (string, optional): Team context
    - **Output**:
      ```typescript
      {
        blockers: {
          critical: Array<Blocker>,
          moderate: Array<Blocker>,
          minor: Array<Blocker>
        },
        analysis: BlockerAnalysis,
        recommendations: Array<Resolution>
      }
      ```
    - **Errors**:
      - No progress data found
      - Analysis failed
  - **Supporting Files**:
    - `services/analysis/blocker-detection.ts`: Blocker analysis
    - `services/funnel-progress.ts`: Progress status

### Integration Points

#### Database Models
- **FunnelProgress**: Tracks progress through marketing funnels
- **MilestoneProgress**: Individual milestone completion status
- **FunnelAnalysisRecord**: Stores analysis results and insights
- **FunnelSuggestedAction**: Tracks recommended next steps

#### External Services
- **Not Diamond Router**: Optimal LLM selection for analysis
- **LLM Analysis**: Intelligent progress evaluation
- **Agent System**: Progress-based agent recommendations

### Workflows

1. Progress Overview:
   - Aggregate progress data across funnels
   - Generate insights using LLM analysis
   - Provide actionable recommendations

2. Next Steps:
   - Evaluate current progress state
   - Identify optimal next actions
   - Generate prioritized recommendations

3. Blocker Analysis:
   - Detect progress obstacles
   - Analyze impact and priority
   - Suggest resolution strategies


# 14. Navigation

#### `api/navigation/sidebar_agents.ts`
- **Description**: Retrieves and organizes agent hierarchy and conversations for sidebar navigation, including main agent chats and sub-conversations categorized by agent type.
- **What Developers Need to Send**:
  - **HTTP Method**: `GET`
  - **Query Parameters**:
    - `userId` (required): The ID of the user requesting the navigation data.
- **Response**:
  - **Success**:
    - `200 OK`: JSON object with categorized agents and their conversations.
    - Example:
      ```json
      {
        "categories": {
          "ADMINISTRATIVE": [
            {
              "id": "conv_123",
              "agentId": "agent_456",
              "agentName": "Shawn",
              "category": "ADMINISTRATIVE",
              "lastMessage": "2025-01-20T10:00:00Z",
              "subChats": [
                {
                  "id": "conv_789",
                  "name": "Project A Discussion",
                  "lastMessage": "2025-01-20T09:00:00Z"
                }
              ]
            }
          ],
          "MARKETING": [],
          "SALES": [],
          "SOCIAL_MEDIA": [],
          "COPY_EDITING": []
        }
      }
      ```
  - **Errors**:
    - `400 Bad Request`: Missing userId parameter.
    - `405 Method Not Allowed`: Invalid HTTP method used.
    - `500 Internal Server Error`: Failed to fetch navigation data.
- **Supporting Files**:
  - `models/Agent`: Prisma model for agent data.
  - `models/UserConversation`: Prisma model for conversations.
  - `models/ConversationName`: Prisma model for named conversations.
  - `types/AgentCategory`: Enum for agent categories.


  #### `api/suggestions/actions.ts`
- **Description**: Provides intelligent next action suggestions based on user's funnel progress, data completeness, and system prerequisites. Analyzes current state to recommend the most important next steps.
- **What Developers Need to Send**:
  - **HTTP Method**: `GET`
  - **Query Parameters**:
    - `userId` (required): The ID of the user requesting suggestions.
    - `teamId` (optional): Team ID for team-specific suggestions.
- **Response**:
  - **Success**:
    - `200 OK`: JSON object with prioritized suggested actions.
    - Example:
      ```json
      {
        "suggestions": [
          {
            "id": "onboarding-1234567890",
            "type": "start_funnel",
            "title": "Complete Your Onboarding",
            "description": "Start with providing basic information about your business",
            "priority": 1,
            "action": {
              "type": "navigate",
              "target": "/funnels/abc123/start"
            }
          },
          {
            "id": "data-def456-1234567890",
            "type": "complete_data",
            "title": "Complete Positioning Information",
            "description": "Provide missing information: Business Goals",
            "priority": 2,
            "action": {
              "type": "form",
              "target": "/funnels/def456/data",
              "metadata": {
                "missingFields": ["businessGoals"]
              }
            }
          }
        ]
      }
      ```
  - **Errors**:
    - `400 Bad Request`: Missing userId parameter.
    - `405 Method Not Allowed`: Invalid HTTP method used.
    - `500 Internal Server Error`: Failed to generate suggestions.
- **Supporting Files**:
  - `services/funnel-progress.ts`: Gets current funnel progress
  - `services/user-progress.ts`: Gets overall user progress
  - `models/FunnelDefinition`: Funnel requirements and structure
  - `models/FunnelPrerequisite`: Prerequisites between funnels
  - `models/DataPointCollection`: User's collected data



#### `api/resources/list.ts`
- **Description**: Retrieves available resources and forms with completion status for both individual users and teams. Provides filtering and pagination capabilities.
- **What Developers Need to Send**:
  - **HTTP Method**: `GET`
  - **Query Parameters**:
    - `userId` (required): ID of the user requesting resources
    - `teamId` (optional): Team ID for team completion status
    - `category` (optional): Filter by resource category
    - `type` (optional): Filter by resource type ('assessment', 'form', 'worksheet')
    - `status` (optional): Filter by completion status ('new', 'completed', 'pending')
    - `page` (optional): Page number for pagination (default: 1)
    - `pageSize` (optional): Items per page (default: 10)
- **Response**:
  - **Success**:
    - `200 OK`: JSON object with resources and pagination info
    - Example:
      ```json
      {
        "resources": [
          {
            "id": "form_123",
            "name": "Marketing Success Wheel Assessment",
            "description": "Evaluate your marketing effectiveness",
            "type": "assessment",
            "category": "marketing",
            "status": {
              "isNew": true,
              "userCompleted": false,
              "teamCompleted": true,
              "lastUpdated": "2025-01-20T10:00:00Z",
              "completedBy": "user_456"
            },
            "metadata": {
              "estimatedTime": "30 minutes",
              "difficulty": "intermediate",
              "prerequisites": ["basic_info_form"],
              "relatedFunnels": ["onboarding"],
              "isRequired": true
            }
          }
        ],
        "pagination": {
          "currentPage": 1,
          "pageSize": 10,
          "totalPages": 5,
          "totalCount": 48
        }
      }
      ```
  - **Errors**:
    - `400 Bad Request`: Missing userId parameter
    - `405 Method Not Allowed`: Invalid HTTP method
    - `500 Internal Server Error`: Failed to fetch resources
- **Supporting Files**:
  - `models/FunnelFormRequirement`: Available forms/resources
  - `models/DataPointCollection`: Tracks form completion
  - `services/funnel-progress.ts`: Checks funnel progress for requirements

  



#### `api/conversations/shawn/initiate.ts`
- **Description**: Initializes or continues conversation with Shawn based on comprehensive user and team context, including cross-agent interactions and collaborative activities.
- **What Developers Need to Send**:
  - **HTTP Method**: `POST`
  - **Payload**:
    ```json
    {
      "userId": "required-user-id",
      "teamId": "optional-team-id"
    }
    ```
- **Response**:
  - **Success**:
    - `200 OK`: JSON object with conversation details and enhanced context
    - Example:
      ```json
      {
        "conversationId": "conv_123",
        "context": {
          "isNewUser": false,
          "agentInteractions": [
            {
              "agentName": "Larry",
              "lastInteraction": "2025-01-20T10:00:00Z",
              "topic": "Market Analysis",
              "status": "ongoing"
            }
          ],
          "teamActivity": [
            {
              "type": "milestone_completion",
              "member": "Jane Smith",
              "action": "completed",
              "resource": "Buyer Persona Workshop",
              "timestamp": "2025-01-20T09:00:00Z"
            }
          ],
          "globalProgress": [
            {
              "milestone": "Market Research",
              "status": "completed",
              "contributors": ["John", "Jane"],
              "lastUpdate": "2025-01-19T15:30:00Z"
            }
          ],
          "collaborationInsights": {
            "activeProjects": ["Q1 Marketing Plan"],
            "sharedMilestones": ["Persona Development"],
            "pendingTeamActions": ["Review Content Strategy"]
          }
        },
        "initialMessage": "Welcome back, John! I see you've been working with Larry on Market Analysis. Your team has been active - would you like an update on their progress?"
      }
      ```
  - **Errors**: (same as before)
- **Supporting Files**:
  - Previous files, plus:
  - `services/team/highlight-generator.ts`: Gets team insights
  - `models/ConversationAnalysis`: Analyzes conversation patterns
  - `models/Project`: Manages collaborative projects
  - `models/Goal`: Tracks team goals and actions