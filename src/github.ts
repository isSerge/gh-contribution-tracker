import { graphql } from '@octokit/graphql';

async function fetchOrganizationId(client: typeof graphql, org: string) {
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

export async function fetchUserContributions(client: typeof graphql, org: string, username: string, startDate: Date, endDate: Date) {
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

  // Filter merged pull requests
  const filteredPRContributions = rawResult.user.contributionsCollection.pullRequestContributions.nodes.filter((node: any) => node.pullRequest.merged);

  // Construct new result with filtered pull request contributions
  const result = {
    ...rawResult,
    user: {
      ...rawResult.user,
      contributionsCollection: {
        ...rawResult.user.contributionsCollection,
        pullRequestContributions: {
          nodes: filteredPRContributions
        }
      }
    }
  };

  return result;
}

