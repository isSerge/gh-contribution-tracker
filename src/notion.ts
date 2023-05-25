import { Client, isFullPage } from '@notionhq/client';
import {
  QueryDatabaseResponse,
} from "@notionhq/client/build/src/api-endpoints";

import { ContributionSummary } from "./types";
import { logger } from './logger';
import { handleException } from './error';

export type PostResult = Extract<
  QueryDatabaseResponse["results"][number],
  { properties: Record<string, unknown> }
>;
type PropertyValueMap = PostResult["properties"];
type PropertyValue = PropertyValueMap[string];
type PropertyValueType = PropertyValue["type"];
type ExtractedPropertyValue<TType extends PropertyValueType> = Extract<
  PropertyValue,
  { type: TType }
>;
type PropertyValueTitle = ExtractedPropertyValue<"title">;
type PropertyValueRichText = ExtractedPropertyValue<"rich_text">;

export async function getNamesAndHandles(notion: Client, databaseId: string) {
  try {
    const response = await notion.databases.query({
      database_id: databaseId,
    });

    return response.results.map((page) => {
      if (!isFullPage(page)) return;

      const name = (page.properties.name as PropertyValueTitle).title[0].plain_text;
      const handle = (page.properties.handle as PropertyValueRichText).rich_text[0].plain_text;
      return [name, handle];
    });
  } catch (error) {
    handleException(error, 'getNamesAndHandles');
    return [];
  }
}

const createParagraph = (content: string) => ({
  paragraph: {
    rich_text: [
      { text: { content } }
    ]
  }
});

const blankSpace = createParagraph("");

export async function updateNotionPage(notion: Client, blockId: string, name: string, summary: ContributionSummary) {
  const summaryItems = summary.flatMap((item) => {
    const itemElements = [
      {
        "heading_3": {
          "rich_text": [
            {
              "text": {
                "content": item.repoName,
              }
            }
          ]
        }
      },
      createParagraph(item.focusEmojis),
      createParagraph(item.highlights),
      blankSpace,
    ];

    if (item.issuesClosed.length > 0) {
      itemElements.push(
        createParagraph(`Issues closed (${item.issuesClosed.length}):`),
        ...item.issuesClosed.map(({ issueNumber, issueTitle, issueUrl }) => {
          return {
            "paragraph": {
              "rich_text": [
                {
                  "text": {
                    "content": issueNumber,
                    "link": {
                      "url": issueUrl,
                    }
                  }
                },
                {
                  "text": {
                    "content": ` ${issueTitle}`,
                  }
                }
              ]
            }
          }
        }),
        blankSpace,
      );
    }

    if (item.prsMerged.length > 0) {
      itemElements.push(
        createParagraph(`PRs merged (${item.prsMerged.length}):`),
        ...item.prsMerged.map(({ prNumber, prTitle, prUrl }) => {
          return {
            "paragraph": {
              "rich_text": [
                {
                  "text": {
                    "content": prNumber,
                    "link": {
                      "url": prUrl,
                    }
                  }
                },
                {
                  "text": {
                    "content": ` ${prTitle}`,
                  }
                }
              ]
            }
          }
        }),
        blankSpace,
      );
    }

    return itemElements;
  });

  try {
    await notion.blocks.children.append({
      block_id: blockId,
      children: [
        {
          "heading_2": {
            "rich_text": [
              {
                "text": {
                  "content": name
                }
              }
            ]
          }
        },
        ...summaryItems,
      ],
    });

    logger.info("Notion page updated successfully");
  } catch (error) {
    handleException(error, 'updateNotionPage');
  }
}
