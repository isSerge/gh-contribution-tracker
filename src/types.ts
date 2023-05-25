type TupleStringArray = [string, string][];

export function isTupleStringArray(value: any): value is TupleStringArray {
    return Array.isArray(value) && value.every(item => Array.isArray(item) && item.length === 2 && typeof item[0] === 'string' && typeof item[1] === 'string');
}

export type ContributionSummary = ContributionItem[];

export interface ContributionItem {
    repoName: string;
    focusEmojis: string;
    highlights: string;
    issuesClosed: IssueClosed[];
    prsMerged: PrsMerged[];
}

interface IssueClosed {
    issueNumber: number;
    issueTitle: string;
    issueUrl: string;
}

interface PrsMerged {
    prNumber: number;
    prTitle: string;
    prUrl: string;
}
