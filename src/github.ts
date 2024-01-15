import { graphql } from '@octokit/graphql';

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

interface OrganizationData {
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
              updatedAt
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
    const result: OrganizationData = await client(query, { org, cursor });
    allRepos.push(...result.organization.repositories.edges.map(edge => edge.node));
    hasNextPage = result.organization.repositories.pageInfo.hasNextPage;
    cursor = result.organization.repositories.pageInfo.endCursor;
  }

  return allRepos;
}

export function aggregateData(repos: RepositoryNode[], since: Date) {
  let totalStars = 0;
  let totalForks = 0;
  const recentUpdatedRepos: RepositoryNode[] = [];

  repos.forEach(repo => {
    totalStars += repo.stargazerCount;
    totalForks += repo.forkCount;

    if (new Date(repo.updatedAt) > since) {
      recentUpdatedRepos.push(repo);
    }
  });

  return { totalStars, totalForks, totalCount: repos.length, recentUpdatedRepos };
}
