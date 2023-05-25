import { Client, isFullPage } from '@notionhq/client';
import {
  QueryDatabaseResponse,
} from "@notionhq/client/build/src/api-endpoints";

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

export async function updateNotionPage(notion: Client, blockId: string, name: string, summary: string) {
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
        {
          "paragraph": {
            "rich_text": [
              {
                "text": {
                  "content": summary,
                }
              }
            ]
          }
        }
      ],
    });

    console.log("Page updated successfully");
  } catch (error) {
    console.error("Error updating page: ", error);
  }
}
