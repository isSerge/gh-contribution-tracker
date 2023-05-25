export interface IssueOrPR {
  number: number;
  title: string;
  url: string;
}

export interface Repository {
  name: string;
}

export interface NodeIssue {
  issue: IssueOrPR & { repository: Repository };
}

export interface NodePR {
  pullRequest: IssueOrPR & { repository: Repository };
}

export interface Contributions {
  user: {
    contributionsCollection: {
      issueContributions: {
        nodes: NodeIssue[];
      };
      pullRequestContributions: {
        nodes: NodePR[];
      };
    };
  };
}

// Type guards
export function isNodeIssue(node: NodeIssue | NodePR): node is NodeIssue {
  return 'issue' in node;
}

export function isNodePR(node: NodeIssue | NodePR): node is NodePR {
  return 'pullRequest' in node;
}

type TupleStringArray = [string, string][];

export function isTupleStringArray(value: any): value is TupleStringArray {
    return Array.isArray(value) && value.every(item => Array.isArray(item) && item.length === 2 && typeof item[0] === 'string' && typeof item[1] === 'string');
}
