import { EventConfig, StepHandler } from 'motia';
import { z } from 'zod';

const jobSchema = z.object({
  title: z.string(),
  company_name: z.string(),
  location: z.string(),
  description: z.string().optional(),
  via: z.string().optional(),
  detected_extensions: z.record(z.any()).optional(),
  job_highlights: z.array(z.object({
    title: z.string().optional(),
    items: z.array(z.string()).optional()
  })).optional(),
});

const inputSchema = z.object({
  success: z.boolean(),
  summary: z.string(),
  jobs: z.array(jobSchema).optional(),
  jobTitle: z.string(),
  location: z.string(),
});

export const config: EventConfig = {
  type: 'event',
  name: 'Store Job Summary',
  description: 'Stores the generated job summary in state',
  subscribes: ['jobs.summary.generated'],
  emits: [],
  flows: ['job-search-flow'],
  input: inputSchema,
};

export const handler: StepHandler<typeof config> = async (inputData, { logger, state }) => {
  const { success, summary, jobs, jobTitle, location } = inputData;
  logger.info('Storing job summary in state', { success, jobTitle, location });

  try {
    // Create a unique key based on job title and location
    const stateKey = `job_${jobTitle.replace(/\s+/g, '_').toLowerCase()}_${location.replace(/\s+/g, '_').toLowerCase()}`;
    logger.info('Using state key', { stateKey });
    
    // TTL of 24 hours (in milliseconds)
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    
    // Store each piece of data separately with string keys
    await state.set(`${stateKey}_success`, success.toString(), ONE_DAY_MS);
    await state.set(`${stateKey}_summary`, summary, ONE_DAY_MS);
    await state.set(`${stateKey}_jobs`, JSON.stringify(jobs || []), ONE_DAY_MS);
    await state.set(`${stateKey}_jobTitle`, jobTitle, ONE_DAY_MS);
    await state.set(`${stateKey}_location`, location, ONE_DAY_MS);
    await state.set(`${stateKey}_timestamp`, new Date().toISOString(), ONE_DAY_MS);
    
    // Also store the latest key used
    await state.set('latest_job_search_key', stateKey, ONE_DAY_MS);
    
    logger.info('Job summary stored successfully');
  } catch (error: any) {
    logger.error('Error storing job summary in state', { error: error.message });
  }
}; 