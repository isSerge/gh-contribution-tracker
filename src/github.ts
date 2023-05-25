import { graphql } from '@octokit/graphql';

import { handleException } from './error';
import { isGraphQLResponse, GraphQLResponse } from './types';

async function fetchOrganizationId(client: typeof graphql, org: string): Promise<string> {
  const query = `
    query ($org: String!) {
      organization(login: $org) {
        id
      }
    }
  `;

  const result = await client(query, { org });

  return (result as any).organization.id;
}
export async function fetchUserContributions(client: typeof graphql, org: string, username: string, startDate: Date, endDate: Date): Promise<GraphQLResponse | null> {
  try {
    const organizationId = await fetchOrganizationId(client, org);

    const query = `
      query ($username: String!, $orgId: ID!, $from: DateTime!, $to: DateTime!) {
        user(login: $username) {
          contributionsCollection(organizationID: $orgId, from: $from, to: $to) {
            startedAt
            endedAt
            hasAnyContributions
            hasActivityInThePast
            issueContributions(first: 100) {
              nodes {
                issue {
                  title
                  number
                  url
                  repository {
                    name
                  }
                }
              }
            }
            pullRequestContributions(first: 100) {
              nodes {
                pullRequest {
                  title
                  number
                  url
                  merged
                  repository {
                    name
                  }
                }
              }
            }
          }
        }
      }  
    `;

    const rawResult: any = await client(query, {
      username,
      orgId: organizationId,
      from: startDate.toISOString(),
      to: endDate.toISOString(),
    });

    if (!isGraphQLResponse(rawResult)) {
      throw new Error("Response from GitHub does not match expected structure");
    }

    // rawResult is now guaranteed to be a GraphQLResponse, so it can be casted.
    const validatedResult: GraphQLResponse = rawResult;

    // Filter merged pull requests
    const filteredPRContributions = rawResult.user.contributionsCollection.pullRequestContributions.nodes.filter((node) => node.pullRequest.merged);

    // Construct new result with filtered pull request contributions
    const result = {
      ...validatedResult,
      user: {
        ...validatedResult.user,
        contributionsCollection: {
          ...validatedResult.user.contributionsCollection,
          pullRequestContributions: {
            nodes: filteredPRContributions
          }
        }
      }
    };

    return result;
  } catch (error) {
    handleException(error, 'fetchUserContributions');
    return null;
  }
}
