import { fetchUserContributions } from "./api"
import { graphql } from '@octokit/graphql';
import { OpenAI } from "langchain/llms/openai";
import { config } from 'dotenv';
import { Client } from '@notionhq/client';

import { formatAsPromptInput } from "./format";
import { getContributionSummary } from "./langchain";
import { Contributions, isTupleStringArray } from './types';
import { getNamesAndHandles } from './notion';

config();

const githubToken = process.env.GITHUB_TOKEN;

const graphqlClient = graphql.defaults({
  headers: {
    authorization: `token ${githubToken}`,
  },
});


const openAIApiKey = process.env.OPENAI_API_KEY;

const model = new OpenAI({
  openAIApiKey,
  temperature: 0.9,
  modelName: "gpt-3.5-turbo",
  // modelName: "gpt-4",
  streaming: true,
  callbacks: [
    {
      handleLLMNewToken(token: string) {
        process.stdout.write(token);
      },
    },
  ],
});

const notionApiKey = process.env.NOTION_API_KEY;
const databaseId = process.env.NOTION_DATABASE_ID as string;

const notion = new Client({ auth: notionApiKey });

export async function main(
  startDateInput?: Date, endDateInput?: Date
) {
  const endDate = endDateInput || new Date();
  const startDate = startDateInput || new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() - 14);
  const tuples = await getNamesAndHandles(notion, databaseId);

  // TODO: handle this properly
  if (!isTupleStringArray(tuples)) return;

  for (const [name, githubHandle] of tuples) {
    const contributions = await fetchUserContributions(graphqlClient, 'subspace', githubHandle, startDate, endDate) as Contributions;
    const formattedContributions = formatAsPromptInput(contributions);
    const summary = await getContributionSummary(model, formattedContributions);

    // TODO: Add a notion page for the user and add the summary to it.
  }
}

main();

