export function formatAsPrompt(contributions: any, username: string): string {
  const {
    issueContributions,
    pullRequestContributions,
  } = contributions.user.contributionsCollection;

  const issuesByRepo: { [repo: string]: any[] } = {};
  const prsByRepo: { [repo: string]: any[] } = {};

  issueContributions.nodes.forEach((node: any) => {
    const repo = node.issue.repository.name;
    if (!issuesByRepo[repo]) {
      issuesByRepo[repo] = [];
    }
    issuesByRepo[repo].push(node.issue);
  });

  pullRequestContributions.nodes.forEach((node: any) => {
    const repo = node.pullRequest.repository.name;
    if (!prsByRepo[repo]) {
      prsByRepo[repo] = [];
    }
    prsByRepo[repo].push(node.pullRequest);
  });

  let prompt = `Here are the GitHub activities for ${username} from ${contributions.user.contributionsCollection.startedAt} to ${contributions.user.contributionsCollection.endedAt}:\n\n`;

  for (const repo in issuesByRepo) {
    prompt += `Repository: ${repo}\nIssues:\n`;
    issuesByRepo[repo].forEach((issue: any, index: number) => {
      prompt += `${index + 1}. ${issue.title} (Created at: ${issue.createdAt})\n`;
    });
    prompt += '\n';
  }

  for (const repo in prsByRepo) {
    prompt += `Repository: ${repo}\nPull Requests:\n`;
    prsByRepo[repo].forEach((pr: any, index: number) => {
      prompt += `${index + 1}. ${pr.title} (Created at: ${pr.createdAt})\n`;
    });
    prompt += '\n';
  }

  return prompt;
}
