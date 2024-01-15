import { Octokit } from '@octokit/rest';
// import { OpenAI } from "langchain/llms/openai";
import { config } from 'dotenv';
// import * as fsp from 'fs/promises';

import { fetchOrganizationActivity } from "./github"
// import { getContributionSummary } from "./langchain";
// import { logger } from './logger';
import { handleException } from './error';

config();

const githubToken = process.env.GITHUB_TOKEN;

const octokit = new Octokit({ auth: githubToken });


// const openAIApiKey = process.env.OPENAI_API_KEY;

// const model = new OpenAI({
//   openAIApiKey,
//   temperature: 0.9,
//   modelName: "gpt-3.5-turbo",
//   // modelName: "gpt-4",
// });

const githubOrg = process.env.GITHUB_ORG_NAME as string;

export async function main() {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  try {
    const data = await fetchOrganizationActivity(octokit, githubOrg, oneWeekAgo);

    console.log(data);

  } catch (error) {
    handleException(error, 'main');
  }
}

main();

