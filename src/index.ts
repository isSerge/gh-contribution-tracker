import { logger } from "./logger"
import { fetchUserContributions } from "./api"
import { formatAsPrompt } from "./format"

export async function main() {
  const startDate = new Date('2023-01-01');
  const endDate = new Date('2023-12-31');
  const username = 'isSerge';
  const contributions = await fetchUserContributions('subspace', username, startDate, endDate);
  const prompt = formatAsPrompt(contributions, username);
  logger.info(prompt);
}

main();
