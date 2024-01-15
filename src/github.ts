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
  openIssues: number;
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
  const issuesOpen = await octokit.issues.listForRepo({
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
    openIssues: issuesOpen.data.length,
    closedIssues: issuesClosed.data.length,
  };
}


export async function aggregateData(octokit: Octokit, githubOrg: string, repos: RepositoryNode[], since: Date) {
  let stars = 0;
  let forks = 0;
  const recentUpdatedRepos: RepositoryNode[] = [];
  let openIssues = 0;
  let closedIssues = 0;
  let newPRs = 0;
  let mergedPRs = 0;

  for (const repo of repos) {
    stars += repo.stargazerCount;
    forks += repo.forkCount;

    if (new Date(repo.updatedAt) > since) {
      recentUpdatedRepos.push(repo);

      const issueCounts = await fetchIssueCountsForRepo(octokit, githubOrg, repo.name, since);
      const prCounts = await fetchPullRequestCountsForRepo(octokit, githubOrg, repo.name, since);

      openIssues += issueCounts.openIssues;
      closedIssues += issueCounts.closedIssues;
      newPRs += prCounts.openPullRequests;
      mergedPRs += prCounts.mergedPullRequests;
    }
  }

  return {
    stars,
    forks,
    repoCount: repos.length,
    recentUpdatedRepos,
    openIssues,
    closedIssues,
    newPRs,
    mergedPRs,
  };
}

interface PullRequestCounts {
  openPullRequests: number;
  mergedPullRequests: number;
}

async function fetchPullRequestCountsForRepo(
  octokit: Octokit,
  org: string,
  repo: string,
  since: Date
): Promise<PullRequestCounts> {
  try {
    const openPullRequests = await octokit.pulls.list({
      owner: org,
      repo,
      state: 'open',
    });

    const mergedPullRequests = await octokit.pulls.list({
      owner: org,
      repo,
      state: 'closed',
      base: 'main',
    });

    const openPullRequestsSince = openPullRequests.data.filter(
      (pr) => new Date(pr.created_at) >= since
    );

    const mergedPullRequestsSince = mergedPullRequests.data.filter((pr) => {
      if (pr.merged_at !== null) {
        return new Date(pr.merged_at) >= since;
      }
      return false;
    });

    return {
      openPullRequests: openPullRequestsSince.length,
      mergedPullRequests: mergedPullRequestsSince.length,
    };
  } catch (error) {
    console.error(`Error fetching pull requests for ${repo}:`, error);
    return { openPullRequests: 0, mergedPullRequests: 0 };
  }
}

