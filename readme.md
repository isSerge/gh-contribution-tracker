# GitHub Contribution Tracker

This project is an automation tool to fetch and summarize a GitHub user's contributions to a specific organization within a defined time period. It then updates a Notion page with the contribution summary.

## Structure

The project consists of several TypeScript files, each serving a different purpose:

1. `github.ts`: Fetches contributions of a GitHub user.
2. `index.ts`: The main entry point of the application. It sets up the necessary configurations and clients for GraphQL, Langchain's OpenAI, and Notion. It also triggers the main function to fetch and post updates.
3. `langchain.ts`: Uses the Langchain LLM (Language Learning Model) service to generate a summary of contributions.
4. `logger.ts`: Sets up the logging service for the application.
5. `notion.ts`: Handles the Notion API interactions.
6. `types.ts`: Defines the data types used across the application.

## Main Features

<img width="438" alt="image" src="https://github.com/isSerge/gh-contribution-tracker/assets/13568875/1f2330fc-fd2d-462a-9981-5fb2c94cd68b">

The main features of the app are:

- Fetching GitHub user contributions data via the GitHub GraphQL API.
- Summarizing the contribution data into a concise and readable format using an AI model from Langchain.
- Updating a Notion page with the summarized contribution data.

## Setup and Usage

The application requires several environment variables:

- `GITHUB_TOKEN`: GitHub API token.
- `OPENAI_API_KEY`: API key for Langchain's LLM service.
- `NOTION_API_KEY`: API key for Notion.
- `NOTION_DATABASE_ID`: ID of the Notion database containing the GitHub usernames.
- `NOTION_UPDATES_BLOCK_ID`: ID of the Notion block where the updates are to be posted.
- `GITHUB_ORG_NAME`: GitHub organization name.

Once the environment variables are set, you can utilize the npm scripts to run the application and manage its lifecycle:

- `npm start`: Runs the application.
- `npm run build`: Builds the application by transpiling the TypeScript source files to JavaScript using the TypeScript compiler.
- `npm run lint`: Lints the TypeScript source files using ESLint.

## Dependencies

This project has the following dependencies:

- `@octokit/graphql`: GitHub GraphQL client.
- `@notionhq/client`: Notion API client.
- `dotenv`: Load environment variables from a `.env` file.
- `pino` and `pino-pretty`: Logging library and pretty-printing add-on.
- `langchain/llms/openai`: Langchain's LLM service client.

## Contribution and Issues

Contributions are welcome. Feel free to open issues if you find any.

## License

This project is licensed under the MIT License.
