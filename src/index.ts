import { fetchUserContributions } from "./api"
import { formatAsPromptInput } from "./format";
import { getContributionSummary } from "./langchain";

export async function main() {
  const startDate = new Date('2023-01-01');
  const endDate = new Date('2023-12-31');
  const username = 'isSerge';
  const contributions = await fetchUserContributions('subspace', username, startDate, endDate);
  const formattedContributions = formatAsPromptInput(contributions);

  // console.log({ formattedContributions })

  const summary = await getContributionSummary(formattedContributions);

  console.log(summary);
}

main();
