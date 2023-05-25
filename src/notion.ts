import { Client, isFullPage } from '@notionhq/client';
import {
  QueryDatabaseResponse,
} from "@notionhq/client/build/src/api-endpoints";

import { ContributionSummary } from "./types";

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
  const response = await notion.databases.query({
    database_id: databaseId,
  });

  return response.results.map((page) => {
    if (!isFullPage(page)) return;

    const name = (page.properties.name as PropertyValueTitle).title[0].plain_text;
    const handle = (page.properties.handle as PropertyValueRichText).rich_text[0].plain_text;
    return [name, handle];
  });
}

export async function updateNotionPage(notion: Client, blockId: string, name: string, summary: ContributionSummary) {
  const summaryItems = summary.flatMap((item) => {
    return [
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
      {
        "paragraph": {
          "rich_text": [
            {
              "text": {
                "content": item.focusEmojis,
              }
            }
          ]
        }
      },
      {
        "paragraph": {
          "rich_text": [
            {
              "text": {
                "content": item.highlights,
              }
            }
          ]
        }
      },
      // adding blank space
      {
        "paragraph": {
          "rich_text": [
            {
              "text": {
                "content": "",
              }
            }
          ]
        }
      },
      {
        "paragraph": {
          "rich_text": [
            {
              "text": {
                "content": "Issues closed:",
              }
            }
          ]
        }
      },
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
      // adding blank space
      {
        "paragraph": {
          "rich_text": [
            {
              "text": {
                "content": "",
              }
            }
          ]
        }
      },
      {
        "paragraph": {
          "rich_text": [
            {
              "text": {
                "content": "PRs merged:",
              }
            }
          ]
        }
      },
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
    ]
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
        ...summaryItems as any,
      ],
    });

    console.log("Page updated successfully");
  } catch (error) {
    console.error("Error updating page: ", error);
  }
}
