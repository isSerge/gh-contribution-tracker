import { OpenAI } from "langchain/llms/openai";
import { PromptTemplate } from "langchain/prompts";
import { LLMChain } from "langchain/chains";

export const getContributionSummary = async (llm: OpenAI, contributions: string) => {
  const template = `
    You are an engineer who is contributing to an open-source organization.
    Describe contribution highlights for each repository.
    Highlights should not repeat pull-requests or issues, but should be a summary of the contributions.
    Next, include list of issue numbers and pull request numbers.
    Follow this format:
    <repo name>
    Highlights: 
    <repo contribution highlights>
    Issues closed:
    <issue number>. <issue title> (<issue url>)
    PRs merged:
    <pr number>. <pr title> (<pr url>)
    Here is the actual contribution data:  
    {contributions}
  `;

  const prompt = new PromptTemplate({
    template: template,
    inputVariables: ["contributions"],
  });

  const chain = new LLMChain({ llm, prompt, });
  const res = await chain.call({ contributions });
  return res;
};
