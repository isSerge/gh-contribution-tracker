import { OpenAI } from "langchain/llms/openai";
import { PromptTemplate } from "langchain/prompts";
import { LLMChain } from "langchain/chains";
import { config } from 'dotenv';

config();

const openAIApiKey = process.env.OPENAI_API_KEY;

const llm = new OpenAI({
  openAIApiKey,
  temperature: 0.9,
  modelName: "gpt-3.5-turbo",
  // modelName: "gpt-4",
  streaming: true,
  callbacks: [
    {
      handleLLMNewToken(token: string) {
        process.stdout.write(token);
      },
    },
  ],
});

export const getContributionSummary = async (contributions: string) => {
  const template = `
    You are an engineer who is contributing to an open-source organization.
    Describe contribution highlights for each repository based on the information below.
    Every highlight should include issue or pull request numbers in the brackets.
    Group related highlights together. Provide brief summary before moving to each repository.
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
