import { graphql } from '@octokit/graphql';
import { fetchRepoIssues } from "./issues";

interface RepositoryNode {
  name: string;
  description: string;
  url: string;
  stargazerCount: number;
  forkCount: number;
  updatedAt: string;
}

interface RepositoryEdge {
  node: RepositoryNode;
  cursor: string;
}

interface RepositoryPageInfo {
  hasNextPage: boolean;
  endCursor: string;
}

interface OrganizationRepositories {
  edges: RepositoryEdge[];
  pageInfo: RepositoryPageInfo;
}

interface OrganizationDataResponse {
  organization: {
    repositories: OrganizationRepositories;
  };
}

export async function fetchOrganizationRepos(client: typeof graphql, org: string): Promise<RepositoryNode[]> {
  let hasNextPage = true;
  let cursor: string | null = null;
  const allRepos = [];

  const query = `
    query ($org: String!, $cursor: String) {
      organization(login: $org) {
        repositories(first: 10, after: $cursor) {
          edges {
            node {
              name
              description
              url
              stargazerCount
              forkCount
            }
            cursor
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    }  
  `;

  while (hasNextPage) {
    const result: OrganizationDataResponse = await client(query, { org, cursor });
    allRepos.push(...result.organization.repositories.edges.map(edge => edge.node));
    hasNextPage = result.organization.repositories.pageInfo.hasNextPage;
    cursor = result.organization.repositories.pageInfo.endCursor;
  }

  return allRepos;
}

export async function aggregateData(client: typeof graphql, org: string, repos: RepositoryNode[], since: Date) {
  let totalStars = 0;
  let totalForks = 0;
  const recentUpdatedRepos: RepositoryNode[] = [];
  const openIssues = [];
  const closedIssues = [];

  for (const repo of repos) {
    totalStars += repo.stargazerCount;
    totalForks += repo.forkCount;

    const issues = await fetchRepoIssues(client, org, repo.name, since);

    const open = issues.filter(issue => issue.state === 'OPEN');
    const closed = issues.filter(issue => issue.state === 'CLOSED');

    openIssues.push(...open);
    closedIssues.push(...closed);
  }

  return {
    totalStars,
    totalForks,
    repoCount: repos.length,
    recentUpdatedRepos,
    issues: {
      open: openIssues.length,
      closed: closedIssues.length,
    }
  };
}
