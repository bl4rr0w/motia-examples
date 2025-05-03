import { ApiRouteConfig, StepHandler } from 'motia';
import { z } from 'zod';

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'Get Job Summary',
  description: 'Returns the latest job summary',
  path: '/job-summary',
  virtualSubscribes: ['/job-summary'],
  method: 'GET',
  emits: [],
  flows: ['job-search-flow'],
};

export const handler: StepHandler<typeof config> = async (req, { logger, state }) => {
  logger.info('Fetching job summary');

  try {
    // Get the latest job search key
    const latestKey = await state.get('latest_job_search_key', '');
    
    if (!latestKey) {
      // Return a more helpful message with example curl commands
      return {
        status: 200,
        body: { 
          message: 'No job search has been performed yet. Try one of these commands:',
          examples: {
            searchCommand: 'curl -X POST http://localhost:3000/search-jobs -H "Content-Type: application/json" -d \'{"jobTitle":"Software Engineer","location":"San Francisco"}\'',
            directSearchCommand: 'curl -X POST http://localhost:3000/direct-job-search -H "Content-Type: application/json" -d \'{"jobTitle":"Software Engineer","location":"San Francisco"}\''
          },
          status: 'ready'
        },
      };
    }

    logger.info('Found job summary key', { latestKey });

    // Retrieve all pieces of data
    const success = await state.get(`${latestKey}_success`, 'false');
    const summary = await state.get(`${latestKey}_summary`, '');
    const jobsJson = String(await state.get(`${latestKey}_jobs`, '[]'));
    const jobTitle = await state.get(`${latestKey}_jobTitle`, '');
    const location = await state.get(`${latestKey}_location`, '');
    const timestamp = await state.get(`${latestKey}_timestamp`, '');

    // Parse the jobs JSON
    const jobs = JSON.parse(jobsJson);

    return {
      status: 200,
      body: {
        success: success === 'true',
        summary,
        jobs,
        jobTitle,
        location,
        timestamp,
      },
    };
  } catch (error: any) {
    logger.error('Error processing job summary data', { error: error.message });
    return {
      status: 500,
      body: { 
        error: `Error retrieving job summary data: ${error.message}`,
        suggestions: [
          'Make sure your API keys are set correctly in the .env file',
          'Run the fix-env.sh script to verify your configuration',
          'Try using the direct search endpoint instead: curl -X POST http://localhost:3000/direct-job-search -H "Content-Type: application/json" -d \'{"jobTitle":"Software Engineer","location":"San Francisco"}\''
        ]
      },
    };
  }
}; 