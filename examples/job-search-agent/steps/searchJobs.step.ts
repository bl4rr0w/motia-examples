import { ApiRouteConfig, StepHandler } from 'motia';
import { z } from 'zod';

const inputSchema = z.object({
  jobTitle: z.string().min(1, "Job title is required"),
  location: z.string().min(1, "Location is required"),
});

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'Search Jobs API',
  description: 'Triggers job search based on job title and location',
  path: '/search-jobs',
  virtualSubscribes: ['/search-jobs'],
  method: 'POST',
  emits: ['job.search.requested'],
  bodySchema: inputSchema,
  flows: ['job-search-flow'],
};

export const handler: StepHandler<typeof config> = async (req, { logger, emit }) => {
  logger.info('Processing job search request', req.body);

  const { jobTitle, location } = req.body;

  await emit({
    topic: 'job.search.requested',
    data: {
      jobTitle,
      location,
    },
  });

  return {
    status: 200,
    body: { 
      message: 'Job search initiated', 
      jobTitle,
      location
    },
  };
}; 