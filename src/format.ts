import { Contributions, NodeIssue, NodePR, IssueOrPR, Repository, isNodeIssue, isNodePR } from './types';

export function formatAsPromptInput(contributions: Contributions): string {
  const {
    issueContributions,
    pullRequestContributions,
  } = contributions.user.contributionsCollection;

  // Function to format issues and pull requests for a repository
  const formatContributions = (contributions: (NodeIssue | NodePR)[], type: 'Issues' | 'Pull Requests') => {
    // Create an object that groups issues/PRs by repository
    const contributionsByRepo = contributions.reduce((acc, node) => {
      let contribution: IssueOrPR & { repository: Repository };

      if (isNodeIssue(node)) {
        contribution = node.issue;
      } else if (isNodePR(node)) {
        contribution = node.pullRequest;
      } else {
        // This should never happen if the type guards are correct
        throw new Error(`Unknown node type: ${JSON.stringify(node)}`);
      }

      const repoName = contribution.repository.name;

      if (!acc[repoName]) {
        acc[repoName] = [];
      }

      acc[repoName].push(contribution);

      return acc;
    }, {} as Record<string, IssueOrPR[]>);

    // Format the grouped contributions into a string
    let formattedContributions = '';

    for (const [repoName, repoContributions] of Object.entries(contributionsByRepo)) {
      formattedContributions += `Repository: ${repoName}\n${type}:\n`;

      for (const contribution of repoContributions) {
        formattedContributions += `${contribution.number}. ${contribution.title} (${contribution.url})\n`;
      }

      formattedContributions += '\n';
    }

    return formattedContributions;
  };

  const formattedIssueContributions = formatContributions(issueContributions.nodes, 'Issues');
  const formattedPRContributions = formatContributions(pullRequestContributions.nodes, 'Pull Requests');

  return formattedIssueContributions + formattedPRContributions;
}
