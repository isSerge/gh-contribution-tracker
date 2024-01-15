import { graphql } from '@octokit/graphql';
// import { OpenAI } from "langchain/llms/openai";
import { config } from 'dotenv';
import * as fsp from 'fs/promises';

import { fetchOrganizationRepos } from "./github"
// import { getContributionSummary } from "./langchain";
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

export async function main() {
  try {
    const data = await fetchOrganizationRepos(graphqlClient, githubOrg);

    await fsp.writeFile('data.json', JSON.stringify(data, null, 2));

  } catch (error) {
    handleException(error, 'main');
  }
}

main();

