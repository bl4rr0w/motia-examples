import { ApiRouteConfig, StepHandler } from 'motia';
import { z } from 'zod';
import { getJson } from 'serpapi';
import OpenAI from 'openai';

interface Job {
  title: string;
  company_name: string;
  location: string;
  description?: string;
  job_highlights?: Array<{
    title?: string;
    items?: string[];
  }>;
  [key: string]: any;
}

const inputSchema = z.object({
  jobTitle: z.string().min(1, "Job title is required"),
  location: z.string().min(1, "Location is required"),
});

export const config: ApiRouteConfig = {
  type: 'api',
  name: 'Direct Job Search',
  description: 'Directly searches for jobs and returns summarized results',
  path: '/direct-job-search',
  virtualSubscribes: ['/direct-job-search'],
  method: 'POST',
  emits: [],
  flows: ['direct-search-flow'],
  bodySchema: inputSchema,
};

export const handler: StepHandler<typeof config> = async (req, { logger }) => {
  const { jobTitle, location } = req.body;
  logger.info('Processing direct job search request', { jobTitle, location });

  try {
    // STEP 1: Fetch jobs from SerpAPI
    logger.info('Fetching jobs from SerpAPI', { jobTitle, location });
    
    // Debug log for API key
    const apiKey = process.env.SERPAPI_KEY;
    logger.info('SerpAPI Key check', { 
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey ? apiKey.length : 0 
    });

    if (!apiKey) {
      throw new Error('SERPAPI_KEY environment variable is missing or empty');
    }

    try {
      const response = await getJson({
        engine: 'google_jobs',
        q: jobTitle,
        location: location,
        hl: 'en',
        api_key: apiKey,
      });

      if (!response) {
        throw new Error('SerpAPI returned null or undefined response');
      }

      if (!response.jobs_results || response.jobs_results.length === 0) {
        logger.warn('No jobs found', { jobTitle, location });
        return {
          status: 404,
          body: {
            success: false,
            message: 'No jobs found for the given criteria',
            jobTitle,
            location,
          },
        };
      }

      // Get top 5 jobs or all if less than 5
      const topJobs = response.jobs_results.slice(0, 5) as Job[];
      logger.info(`Found ${topJobs.length} jobs`, { jobTitle, location });

      // STEP 2: Generate summary with OpenAI
      logger.info('Generating summary using OpenAI', { jobCount: topJobs.length });
      
      // Debug log for OpenAI API key
      const openaiApiKey = process.env.OPENAI_API_KEY;
      logger.info('OpenAI API Key check', { 
        hasApiKey: !!openaiApiKey,
        apiKeyLength: openaiApiKey ? openaiApiKey.length : 0 
      });

      if (!openaiApiKey) {
        throw new Error('OPENAI_API_KEY environment variable is missing or empty');
      }

      const openai = new OpenAI({
        apiKey: openaiApiKey,
      });

      // Format jobs for the prompt
      const jobsText = topJobs.map((job: Job, index: number) => {
        const highlights = job.job_highlights
          ? job.job_highlights
              .map((highlight: { title?: string; items?: string[] }) => {
                const title = highlight.title || '';
                const items = highlight.items ? highlight.items.join('\n- ') : '';
                return `${title}:\n- ${items}`;
              })
              .join('\n')
          : '';

        return `Job ${index + 1}:
Title: ${job.title}
Company: ${job.company_name}
Location: ${job.location}
${job.description ? `Description: ${job.description}` : ''}
${highlights ? `Highlights: ${highlights}` : ''}`;
      }).join('\n\n');

      try {
        // Generate summary with OpenAI
        const aiResponse = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful job search assistant that provides concise summaries of job listings.',
            },
            {
              role: 'user',
              content: `I'm looking for ${jobTitle} jobs in ${location}. Here are the top results:\n\n${jobsText}\n\nPlease provide a concise summary of these job opportunities, including common requirements, salary ranges if available, and key highlights. Also note which job seems to be the best match based on the title and requirements.`,
            },
          ],
        });

        const summary = aiResponse.choices[0].message.content;
        logger.info('Summary generated successfully');

        // Return the combined result
        return {
          status: 200,
          body: {
            success: true,
            summary,
            jobs: topJobs,
            jobTitle,
            location,
            timestamp: new Date().toISOString(),
          },
        };
      } catch (openAiError: any) {
        logger.error('OpenAI API error', { 
          error: openAiError.message,
          stack: openAiError.stack,
          status: openAiError.status,
          response: openAiError.response
        });
        throw new Error(`OpenAI error: ${openAiError.message || 'Unknown OpenAI error'}`);
      }
    } catch (serpApiError: any) {
      logger.error('SerpAPI error', { 
        error: serpApiError.message,
        stack: serpApiError.stack
      });
      throw new Error(`SerpAPI error: ${serpApiError.message || 'Unknown SerpAPI error'}`);
    }
  } catch (error: any) {
    const errorMessage = error.message || 'Unknown error occurred';
    logger.error('Error in direct job search', { 
      error: errorMessage,
      stack: error.stack || 'No stack trace available',
      jobTitle,
      location
    });
    
    return {
      status: 500,
      body: {
        success: false,
        message: `Error processing job search: ${errorMessage}`,
        jobTitle,
        location,
      },
    };
  }
}; 