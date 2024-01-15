import { graphql } from '@octokit/graphql';
// import { OpenAI } from "langchain/llms/openai";
import { config } from 'dotenv';

import { fetchOrganization } from "./github"
// import { getContributionSummary } from "./langchain";
// import { isTupleStringArray, ContributionSummary } from './types';
// import { logger } from './logger';
import { handleException } from './error';

config();

const githubToken = process.env.GITHUB_TOKEN;

const graphqlClient = graphql.defaults({
  headers: {
    authorization: `token ${githubToken}`,
  },
});


// const openAIApiKey = process.env.OPENAI_API_KEY;

// const model = new OpenAI({
//   openAIApiKey,
//   temperature: 0.9,
//   modelName: "gpt-3.5-turbo",
//   // modelName: "gpt-4",
// });

const githubOrg = process.env.GITHUB_ORG_NAME as string;

export async function main(
  // startDateInput?: Date, endDateInput?: Date
) {
  // const endDate = endDateInput || new Date();
  // const startDate = startDateInput || new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() - 14);

  try {
    const data = await fetchOrganization(graphqlClient, githubOrg);

    console.log(data);

  } catch (error) {
    handleException(error, 'main');
  }
}

main();

