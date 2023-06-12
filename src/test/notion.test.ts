import { beforeEach, it } from 'node:test'
import * as assert from 'node:assert/strict'
import { Client } from '@notionhq/client';

import {
  getNamesAndHandles,
  updateDevSummary,
} from '../notion';
import { logger } from '../logger';
import { ContributionSummary } from '../types';
import {
  PageObjectResponse,
  PartialPageObjectResponse,
  QueryDatabaseResponse,
} from '@notionhq/client/build/src/api-endpoints';

const databaseId = 'test_database_id';
const blockId = 'test_block_id';
const name = 'test_name';

const client = new Client({ auth: 'test_auth' });

const mockResponse = {
  results: [
    {
      properties: {
        name: { title: [{ plain_text: 'name1' }] },
        handle: { rich_text: [{ plain_text: 'handle1' }] },
      }
    },
    {
      properties: {
        name: { title: [{ plain_text: 'name2' }] },
        handle: { rich_text: [{ plain_text: 'handle2' }] },
      }
    },
  ]
} as unknown as QueryDatabaseResponse;

beforeEach(() => {
  // Disable logging
  logger.level = 'silent';
});

it('getNamesAndHandles returns names and handles', async function () {
  client.databases.query = async () => mockResponse;

  const isFullPageStub = (__page: PageObjectResponse | PartialPageObjectResponse): __page is PageObjectResponse => true;

  const result = await getNamesAndHandles(client, isFullPageStub, databaseId);
  assert.deepStrictEqual(result, [['name1', 'handle1'], ['name2', 'handle2']]);
});

it('updateDevSummary updates a Notion page', async function () {
  const summary: ContributionSummary = [];
  await updateDevSummary(client, blockId, name, summary);
  assert.doesNotReject(updateDevSummary(client, blockId, name, summary));
});



