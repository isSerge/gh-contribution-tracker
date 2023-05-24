import { graphql } from '@octokit/graphql';
import { config } from 'dotenv';

config();

const githubToken = process.env.GITHUB_TOKEN;

const graphqlWithAuth = graphql.defaults({
  headers: {
    authorization: `token ${githubToken}`,
  },
});

async function fetchOrganizationId(org: string) {
  const query = `
    query ($org: String!) {
      organization(login: $org) {
        id
      }
    }
  `;

  const result = await graphqlWithAuth(query, { org });

  return (result as any).organization.id;
}

export async function fetchUserContributions(org: string, username: string, startDate: Date, endDate: Date) {
  const organizationId = await fetchOrganizationId(org);

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

  const result = await graphqlWithAuth(query, {
    username,
    orgId: organizationId,
    from: startDate.toISOString(),
    to: endDate.toISOString(),
  });

  return result;
}
