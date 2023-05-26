import { beforeEach, it } from 'node:test'
import * as assert from 'node:assert/strict'
import { graphql } from '@octokit/graphql';
import {
  fetchOrganizationId,
  fetchUserContributions,
} from '../github';
import { GraphQLResponse } from '../types';
import { logger } from '../logger';

const username = 'testUser';
const endDate = new Date();
const startDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() - 14);
const orgId = 'org123';
const org = 'testOrg';

beforeEach(() => {
  // Disable logging
  logger.level = 'silent';
})

it('fetchOrganizationId returns organization id', async function () {
  const client = (async () => Promise.resolve({
    organization: {
      id: orgId
    }
  })) as unknown as typeof graphql;

  const result = await fetchOrganizationId(client, org);
  assert.strictEqual(result, orgId);
});

it('fetchUserContributions returns user contributions consisting of closed issues and merged PRs', async function () {
  const expectedResponse: GraphQLResponse = {
    user: {
      contributionsCollection: {
        startedAt: startDate.toISOString(),
        endedAt: endDate.toISOString(),
        hasAnyContributions: true,
        hasActivityInThePast: true,
        issueContributions: {
          nodes: [
            {
              issue: {
                title: 'testIssue',
                number: 1,
                url: '',
                repository: {
                  name: 'testRepo'
                },
                state: 'CLOSED',
              }
            },
            {
              issue: {
                title: 'anotherIssue',
                number: 2,
                url: '',
                repository: {
                  name: 'testRepo'
                },
                state: 'OPEN',
              }
            }
          ]
        },
        pullRequestContributions: {
          nodes: [
            {
              pullRequest: {
                title: 'testPr',
                number: 1,
                url: '',
                merged: true,
                repository: {
                  name: 'testRepo'
                }
              }
            },
            {
              pullRequest: {
                title: 'anotherPr',
                number: 2,
                url: '',
                merged: false,
                repository: {
                  name: 'testRepo'
                }
              }
            }
          ]
        }
      }
    }
  };

  const client = (async () => Promise.resolve(expectedResponse)) as unknown as typeof graphql;

  const result = await fetchUserContributions(client, orgId, username, startDate, endDate);

  assert.strictEqual(
    result?.user.contributionsCollection.issueContributions.nodes.length,
    expectedResponse.user.contributionsCollection.issueContributions.nodes.length - 1 // one issue is still open
  );
  assert.strictEqual(
    result?.user.contributionsCollection.pullRequestContributions.nodes.length,
    expectedResponse.user.contributionsCollection.pullRequestContributions.nodes.length - 1 // one PR is not merged
  );
});

it('fetchUserContributions handles exceptions', async function () {
  const client = (async () => Promise.reject(new Error('test error'))) as unknown as typeof graphql;
  const result = await fetchUserContributions(client, orgId, username, startDate, endDate);
  assert.strictEqual(result, null);
});
