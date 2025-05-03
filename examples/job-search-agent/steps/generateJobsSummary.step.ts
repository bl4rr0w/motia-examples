import { EventConfig, StepHandler } from 'motia';
import { z } from 'zod';
import OpenAI from 'openai';

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

type Job = z.infer<typeof jobSchema>;

const inputSchema = z.object({
  success: z.boolean(),
  jobs: z.array(jobSchema).optional(),
  message: z.string().optional(),
  jobTitle: z.string(),
  location: z.string(),
});

export const config: EventConfig = {
  type: 'event',
  name: 'Generate Jobs Summary',
  description: 'Generates a summary of the fetched jobs using OpenAI',
  subscribes: ['jobs.fetched'],
  emits: ['jobs.summary.generated'],
  flows: ['job-search-flow'],
  input: inputSchema,
};

export const handler: StepHandler<typeof config> = async (inputData, { logger, emit }) => {
  const { success, jobs, message, jobTitle, location } = inputData;
  logger.info('Generating summary for jobs', { success, jobCount: jobs?.length || 0, jobTitle, location });

  if (!success || !jobs || jobs.length === 0) {
    await emit({
      topic: 'jobs.summary.generated',
      data: {
        success: false,
        summary: message || 'No jobs to summarize',
        jobTitle,
        location,
      },
    });
    return;
  }

  try {
    // Debug log for API key
    const apiKey = process.env.OPENAI_API_KEY;
    logger.info('OpenAI API Key check', { 
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey ? apiKey.length : 0 
    });

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Format jobs for the prompt
    const jobsText = jobs.map((job: Job, index: number) => {
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

    // Generate summary with OpenAI
    const response = await openai.chat.completions.create({
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

    const summary = response.choices[0].message.content;

    await emit({
      topic: 'jobs.summary.generated',
      data: {
        success: true,
        summary,
        jobs,
        jobTitle,
        location,
      },
    });
  } catch (error: any) {
    logger.error('Error generating summary', { error: error.message });
    await emit({
      topic: 'jobs.summary.generated',
      data: {
        success: false,
        summary: `Error generating summary: ${error.message || 'Unknown error'}`,
        jobs,
        jobTitle,
        location,
      },
    });
  }
}; 