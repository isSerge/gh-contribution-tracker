import { graphql } from '@octokit/graphql';

interface IssuePage {
  totalCount: number;
  nodes: IssueNode[];
  pageInfo: {
    endCursor: string;
    hasNextPage: boolean;
  };
}

interface IssueNode {
  title: string;
  url: string;
  comments: {
    totalCount: number;
  };
  createdAt: string;
  labels: {
    totalCount: number;
  };
  number: number;
  state: string;
  closedAt: string;
  updatedAt: string;
}

export async function fetchRepoIssues(client: typeof graphql, org: string, repoName: string, since: Date): Promise<IssueNode[]> {
  let issues: IssueNode[] = [];
  let endCursor = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const query = `
      query ($org: String!, $repoName: String!, $since: DateTime!, $cursor: String) {
        repository(owner: $org, name: $repoName) {
          issues(first: 100, after: $cursor, states: OPEN, orderBy: {field: UPDATED_AT, direction: DESC}, filterBy: {since: $since}) {
            totalCount
            nodes {
              title
              url
              comments {
                totalCount
              }
              createdAt
              labels {
                totalCount
              }
              number
              state
              closedAt
              updatedAt
            }
            pageInfo {
              endCursor
              hasNextPage
            }
          }
        }
      }
    `;

    const result: { repository: { issues: IssuePage } } = await client(query, {
      repoName,
      since: since.toISOString(),
      org,
      cursor: endCursor
    });

    issues = issues.concat(result.repository.issues.nodes);
    endCursor = result.repository.issues.pageInfo.endCursor;
    hasNextPage = result.repository.issues.pageInfo.hasNextPage;
  }

  return issues;
}
