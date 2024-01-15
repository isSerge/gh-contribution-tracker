import { Octokit } from '@octokit/rest';

interface RepositoryNode {
  name: string;
  description: string;
  url: string;
  stargazerCount: number;
  forkCount: number;
  updatedAt: string;
}

interface IssueCounts {
  newIssues: number;
  closedIssues: number;
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

export async function fetchIssueCountsForRepo(octokit: Octokit, org: string, repo: string, since: Date
): Promise<IssueCounts> {
  const issuesNew = await octokit.issues.listForRepo({
    owner: org,
    repo,
    state: 'open',
    since: since.toISOString(),
  });

  const issuesClosed = await octokit.issues.listForRepo({
    owner: org,
    repo,
    state: 'closed',
    since: since.toISOString(),
  });

  return {
    newIssues: issuesNew.data.length,
    closedIssues: issuesClosed.data.length,
  };
}


export async function aggregateData(octokit: Octokit, githubOrg: string, repos: RepositoryNode[], since: Date) {
  let stars = 0;
  let forks = 0;
  const recentUpdatedRepos: RepositoryNode[] = [];
  let newIssues = 0;
  let closedIssues = 0;

  for (const repo of repos) {
    stars += repo.stargazerCount;
    forks += repo.forkCount;

    if (new Date(repo.updatedAt) > since) {
      recentUpdatedRepos.push(repo);

      const issueCounts = await fetchIssueCountsForRepo(octokit, githubOrg, repo.name, since);

      newIssues += issueCounts.newIssues;
      closedIssues += issueCounts.closedIssues;
    }
  }

  return { stars, forks, repoCount: repos.length, recentUpdatedRepos, newIssues, closedIssues };
}

