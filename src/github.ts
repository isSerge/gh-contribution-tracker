import { Octokit } from '@octokit/rest';

interface RepositoryNode {
  name: string;
  description: string;
  url: string;
  stargazerCount: number;
  forkCount: number;
  updatedAt: string;
}

export async function fetchOrganizationRepos(octokit: Octokit, org: string): Promise<RepositoryNode[]> {
  const allRepos: RepositoryNode[] = [];
  let page = 1;
  let hasNextPage = true;

  while (hasNextPage) {
    const response = await octokit.repos.listForOrg({
      org,
      type: 'public',
      per_page: 100,
      page,
    });

    response.data.forEach(repo => {
      allRepos.push({
        name: repo.name,
        description: repo.description || '',
        url: repo.html_url,
        stargazerCount: repo.stargazers_count || 0,
        forkCount: repo.forks_count || 0,
        updatedAt: repo.updated_at || '',
      });
    });

    hasNextPage = response.data.length === 100;
    page++;
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
