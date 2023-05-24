export function formatAsPromptInput(contributions: any): string {
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

  let prompt = '';

  for (const repo in issuesByRepo) {
    prompt += `Repository: ${repo}\nIssues:\n`;
    issuesByRepo[repo].forEach((issue: any) => {
      prompt += `${issue.number}. ${issue.title} (${issue.url})\n`;
    });
    prompt += '\n';
  }

  for (const repo in prsByRepo) {
    prompt += `Repository: ${repo}\nPull Requests:\n`;
    prsByRepo[repo].forEach((pr: any) => {
      prompt += `${pr.number}. ${pr.title} (${pr.url})\n`;
    });
    prompt += '\n';
  }

  return prompt;
}
