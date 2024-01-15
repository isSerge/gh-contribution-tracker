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
  let avgTimeToMerge = 0;
  let avgCommentsPerMergedPR = 0;

  for (const repo of repos) {
    stars += repo.stargazerCount;
    forks += repo.forkCount;

    if (new Date(repo.updatedAt) > since) {
      recentUpdatedRepos.push(repo);

      const issueCounts = await fetchIssueCountsForRepo(octokit, githubOrg, repo.name, since);
      const prData = await fetchPullRequestForRepo(octokit, githubOrg, repo.name, since);

      openIssues += issueCounts.openIssues;
      closedIssues += issueCounts.closedIssues;
      newPRs += prData.open;
      mergedPRs += prData.merged;
      avgTimeToMerge += prData.avgTimeToMerge;
      avgCommentsPerMergedPR += prData.avgCommentsPerMergedPR;
    }
  }

  return {
    stars,
    forks,
    repoCount: repos.length,
    recentUpdatedRepos,
    issues: {
      open: openIssues,
      closed: closedIssues,
    },
    pullRequests: {
      new: newPRs,
      merged: mergedPRs,
      avgTimeToMerge: avgTimeToMerge / recentUpdatedRepos.length,
      avgCommentsPerMergedPR: avgCommentsPerMergedPR / recentUpdatedRepos.length,
    },
  };
}

interface PullRequestData {
  open: number;
  merged: number;
  avgTimeToMerge: number;
  avgCommentsPerMergedPR: number;
}

async function fetchPullRequestForRepo(
  octokit: Octokit,
  org: string,
  repo: string,
  since: Date
): Promise<PullRequestData> {
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
    open: openPullRequestsSince.length,
    merged: mergedPullRequestsSince.length,
    avgTimeToMerge: calculateAverageTimeToMerge(mergedPullRequestsSince),
    avgCommentsPerMergedPR: await getAverageCommentsPerMergedPR(octokit, mergedPullRequestsSince),
  };
}

interface PullRequest {
  created_at: string;
  merged_at: string | null;
  number: number;
  base: {
    repo: {
      owner: {
        login: string;
      };
      name: string;
    };
  };
}

function calculateAverageTimeToMerge(pullRequests: PullRequest[]): number {
  const mergedPullRequests = pullRequests.filter((pr) => pr.merged_at !== null);

  if (mergedPullRequests.length === 0) {
    return 0;
  }

  const totalMergeTime = mergedPullRequests.reduce((acc, pr) => {
    const createdAt = new Date(pr.created_at);
    const mergedAt = new Date(pr.merged_at as string);
    const diff = mergedAt.getTime() - createdAt.getTime();
    return acc + diff;
  }, 0);

  return totalMergeTime / mergedPullRequests.length;
}

async function getAverageCommentsPerMergedPR(octokit: Octokit, mergedPullRequests: PullRequest[]) {
  let totalComments = 0;
  let prsWithComments = 0; // Track the number of PRs with comments

  for (const pr of mergedPullRequests) {
    // Fetch comments for each pull request
    const comments = await octokit.pulls.listReviewComments({
      owner: pr.base.repo.owner.login,
      repo: pr.base.repo.name,
      pull_number: pr.number,
    });

    // Add the number of comments to the total
    totalComments += comments.data.length;

    // Check if there are comments for this PR
    if (comments.data.length > 0) {
      prsWithComments++;
    }
  }

  // Calculate the average comments per merged pull request
  const averageComments = prsWithComments === 0 ? 0 : totalComments / prsWithComments;

  return averageComments;
}
