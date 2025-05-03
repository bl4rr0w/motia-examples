# Curl Commands for Job Search Agent

This document provides ready-to-use curl commands for directly interacting with the Job Search Agent APIs.

## Check Job Summary

This command retrieves the latest job summary:

```bash
curl -X GET http://localhost:3000/job-summary | jq
```

If no job search has been performed yet, you will get helpful instructions.

## Search for Jobs (Two-Step Process)

This command initiates a job search (Step 1):

```bash
curl -X POST http://localhost:3000/search-jobs \
  -H "Content-Type: application/json" \
  -d '{
    "jobTitle": "Software Engineer",
    "location": "San Francisco"
  }' | jq
```

After a few moments, you can check the results with:

```bash
curl -X GET http://localhost:3000/job-summary | jq
```

## Direct Job Search (One-Step Process)

This command performs the entire job search in one step:

```bash
curl -X POST http://localhost:3000/direct-job-search \
  -H "Content-Type: application/json" \
  -d '{
    "jobTitle": "Software Engineer",
    "location": "San Francisco"
  }' | jq
```

## Customizing the Search

Simply modify the JSON data to change the job title and location:

```bash
curl -X POST http://localhost:3000/direct-job-search \
  -H "Content-Type: application/json" \
  -d '{
    "jobTitle": "Data Scientist",
    "location": "Remote"
  }' | jq
```

## Troubleshooting

If you encounter issues:

1. The Motia server is running (`pnpm run dev`)
2. Your API keys are properly set in the `.env` file
3. Check response errors for specific issues with API keys or services

## Note on Using `jq`

The commands above use `jq` to format the JSON response for better readability. If you don't have `jq` installed:

- You can omit the `| jq` part at the end of each command
- Or install it with:
  - On Ubuntu/Debian: `sudo apt install jq`
  - On macOS: `brew install jq`
  - On Windows: `chocolatey install jq` 