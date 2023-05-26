import { graphql } from '@octokit/graphql';
import { OpenAI } from "langchain/llms/openai";
import { config } from 'dotenv';
import { Client } from '@notionhq/client';

import { fetchUserContributions, fetchOrganizationId } from "./github"
import { getContributionSummary } from "./langchain";
import { isTupleStringArray, ContributionSummary } from './types';
import { getNamesAndHandles, updateNotionPage } from './notion';
import { logger } from './logger';
import { handleException } from './error';

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
});

const notionApiKey = process.env.NOTION_API_KEY;
const databaseId = process.env.NOTION_DATABASE_ID as string;
const updatesBlockId = process.env.NOTION_UPDATES_BLOCK_ID as string;
const githubOrg = process.env.GITHUB_ORG_NAME as string;
const notion = new Client({ auth: notionApiKey });

export async function main(
  startDateInput?: Date, endDateInput?: Date
) {
  const endDate = endDateInput || new Date();
  const startDate = startDateInput || new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() - 14);

  try {
    const tuples = await getNamesAndHandles(notion, databaseId);

    if (!isTupleStringArray(tuples)) {
      throw new Error('Invalid name and handles tuple array');
    }

    await Promise.all(tuples.map(async ([name, githubHandle]) => {
      logger.info(`Fetching contributions for ${name} (${githubHandle})`);
      const orgId = await fetchOrganizationId(graphqlClient, githubOrg);
      const contributions = await fetchUserContributions(graphqlClient, orgId, githubHandle, startDate, endDate);

      if (!contributions) {
        throw new Error('Invalid contributions');
      }

      const rawSummary = await getContributionSummary(model, JSON.stringify(contributions));

      if (!rawSummary) {
        throw new Error('Invalid contribution summary');
      }

      const summary: ContributionSummary = JSON.parse(rawSummary.text);
      await updateNotionPage(notion, updatesBlockId, name, summary);
    }));

    logger.info('All updates added to Notion!');
  } catch (error) {
    handleException(error, 'main');
  }
}

main();

