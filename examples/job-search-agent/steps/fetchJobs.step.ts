import { EventConfig, StepHandler } from 'motia';
import { z } from 'zod';
import { getJson } from 'serpapi';

const inputSchema = z.object({
  jobTitle: z.string(),
  location: z.string(),
});

export const config: EventConfig = {
  type: 'event',
  name: 'Fetch Jobs',
  description: 'Fetches top 5 jobs from Google using SerpAPI',
  subscribes: ['job.search.requested'],
  emits: ['jobs.fetched'],
  flows: ['job-search-flow'],
  input: inputSchema,
};

export const handler: StepHandler<typeof config> = async (inputData, { logger, emit }) => {
  const { jobTitle, location } = inputData;
  logger.info('Fetching jobs', { jobTitle, location });
  
  // Debug log for API key
  const apiKey = process.env.SERPAPI_KEY;
  logger.info('API Key check', { 
    hasApiKey: !!apiKey,
    apiKeyLength: apiKey ? apiKey.length : 0 
  });

  try {
    // Query the SerpAPI for Google Jobs
    const response = await getJson({
      engine: 'google_jobs',
      q: jobTitle,
      location: location,
      hl: 'en',
      api_key: process.env.SERPAPI_KEY,
    });

    if (!response.jobs_results || response.jobs_results.length === 0) {
      logger.warn('No jobs found', { jobTitle, location });
      await emit({
        topic: 'jobs.fetched',
        data: {
          success: false,
          jobs: [],
          message: 'No jobs found for the given criteria',
          jobTitle,
          location,
        },
      });
      return;
    }

    // Get top 5 jobs or all if less than 5
    const topJobs = response.jobs_results.slice(0, 5);
    logger.info(`Found ${topJobs.length} jobs`);

    await emit({
      topic: 'jobs.fetched',
      data: {
        success: true,
        jobs: topJobs,
        jobTitle,
        location,
      },
    });
  } catch (error: any) {
    logger.error('Error fetching jobs', { error: error.message });
    await emit({
      topic: 'jobs.fetched',
      data: {
        success: false,
        jobs: [],
        message: `Error fetching jobs: ${error.message || 'Unknown error'}`,
        jobTitle,
        location,
      },
    });
  }
}; 