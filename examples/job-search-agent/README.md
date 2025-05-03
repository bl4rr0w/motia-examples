# Job Search Agent

A Motia-powered agent that allows you to search for jobs on Google and provides AI-generated summaries of the top results.

## Features

- Search for jobs with a specific job title and location
- Fetches top 5 job results from Google using SerpAPI
- Generates detailed summaries of job listings using OpenAI's GPT-4o
- Provides REST API endpoints to initiate searches and view results

## Prerequisites

- Node.js (v16+)
- pnpm
- SerpAPI Key
- OpenAI API Key

## Environment Setup

Create a `.env` file in the root directory with the following variables:

```
SERPAPI_KEY=your_serpapi_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

You'll need valid API keys from:
- [SerpAPI](https://serpapi.com/) - For scraping Google job listings
- [OpenAI](https://platform.openai.com/) - For generating job summaries with GPT-4o

## Installation

1. Clone the repository:
```bash
git clone https://github.com/bl4rr0w/motia-examples.git
cd examples/job-search-agent
```

2. Install dependencies:
```bash
pnpm install
```

3. Start the development server:
```bash
pnpm run dev
```

The server will run on `http://localhost:3000`.

## Usage

### API Endpoints

There are two ways to use the job search agent:

#### Option 1: Two-Step Process (Event-Based Flow)

1. **Search for Jobs**

   Endpoint: `POST /search-jobs`
   
   Example:
   ```bash
   curl -X POST http://localhost:3000/search-jobs \
     -H "Content-Type: application/json" \
     -d '{
       "jobTitle": "Software Engineer",
       "location": "San Francisco"
     }'
   ```

2. **Get Job Summary**

   Endpoint: `GET /job-summary`
   
   Example:
   ```bash
   curl -X GET http://localhost:3000/job-summary
   ```
   
   This endpoint retrieves the results of the most recent job search.

#### Option 2: Direct Search (Single Call)

For a simpler approach, you can use the direct search endpoint which handles job fetching and summarization in a single call:

Endpoint: `POST /direct-job-search`

Example:
```bash
curl -X POST http://localhost:3000/direct-job-search \
  -H "Content-Type: application/json" \
  -d '{
    "jobTitle": "Software Engineer",
    "location": "San Francisco"
  }'
```

This endpoint returns both the job listings and the summary in a single response.

## Project Structure

```
job-search-agent/
├── .env                # Environment variables
├── package.json        # Project configuration
├── CURL_COMMANDS.md    # Examples of API usage
└── steps/              # Motia workflow steps
    ├── searchJobs.step.ts          # API endpoint for job search
    ├── fetchJobs.step.ts           # Fetches jobs from SerpAPI
    ├── generateJobsSummary.step.ts # Generates summary using OpenAI
    ├── storeJobSummary.step.ts     # Stores summary in state
    ├── getJobSummary.step.ts       # API endpoint to retrieve summary
    └── directJobSearch.step.ts     # Direct search endpoint
```

## Workflow

### Two-Step Process
1. The user submits a job title and location through the API
2. The system fetches job listings from Google using SerpAPI
3. OpenAI's GPT-4o generates a summary of the top job listings
4. The summary is stored in the application state
5. The user can retrieve the summary through the API

### Direct Search
1. The user submits a job title and location through the direct API
2. The system fetches job listings and generates a summary in a single request
3. The complete results are returned directly in the API response

## Troubleshooting

If you encounter issues:

1. **Check environment variables**: Make sure your `.env` file contains valid API keys for both SerpAPI and OpenAI.

2. **API Key errors**: If you see "Missing API Key" errors, check that your API keys are correctly formatted and not expired.

3. **State management issues**: The two-step process relies on state management. If you're having trouble retrieving job summaries, try using the direct search endpoint instead.

4. **See curl examples**: Check the `CURL_COMMANDS.md` file for ready-to-use examples.

## Technology Stack

- [Motia](https://github.com/MotiaDev/motia) - Backend framework
- [SerpAPI](https://serpapi.com/google-jobs-api) - For scraping Google job listings
- [OpenAI](https://openai.com/) - For generating job summaries with GPT-4o

## License

MIT 
