import { OpenAI } from "langchain/llms/openai";
import { PromptTemplate } from "langchain/prompts";
import { LLMChain } from "langchain/chains";

import { handleException } from './error';

export const getContributionSummary = async (llm: OpenAI, contributions: string) => {
  try {
    const template = `
      You are an engineer contributing to an open-source organization. Your task is to provide a summary of your contributions to each repository.
      The summary should not be a mere listing of pull requests or issues but should highlight the major contributions in a summarized manner. After describing the highlights, include a list of issue numbers and pull request numbers.
      Your response should be in JSON format as Array of objects with following properties:
      "repoName": "string",
      "focusEmojis": "string", // A string of 5 Emojis that represents your focus while working on this repository, should not be empty
      "highlights": "string",  // A summary of your contributions to the repository, should not be empty
      "issuesClosed": [], // array of Issues closed
      "prsMerged": [] // array of PRs merged
  
      Issue closed object properties:
      "issueNumber": "string", // The number of the issue
      "issueTitle": "string",  // The title of the issue
      "issueUrl": "string"     // The URL where the issue is located
  
      PR merged object properties:
      "prNumber": "string", // The number of the pull request
      "prTitle": "string",  // The title of the pull request
      "prUrl": "string"     // The URL where the pull request is located
      Make sure JSON is valid!
      Given this actual contribution data: {contributions}
    `;

    const prompt = new PromptTemplate({
      template: template,
      inputVariables: ["contributions"],
    });

    const chain = new LLMChain({ llm, prompt, });
    const res = await chain.call({ contributions });
    return res;
  } catch (error) {
    handleException(error, 'getContributionSummary');
    return null;
  }
};
