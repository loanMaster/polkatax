import { http, HttpResponse } from "msw";
import { Block } from "../../../src/server/blockchain/substrate/model/block";

export const createBlockHandlers = (timestamp: number) => {
  return [
    http.post(
      "https://*.api.subscan.io/api/scan/block",
      async ({ request }): Promise<HttpResponse<{ data: Block }>> => {
        return HttpResponse.json({
          data: {
            block_num: 1000,
            block_timestamp: timestamp / 1000,
          },
        });
      },
    ),
    http.post(
      "https://*.api.subscan.io/api/v2/scan/blocks",
      async ({
        request,
      }): Promise<HttpResponse<{ data: { blocks: Block[] } }>> => {
        return HttpResponse.json({
          data: {
            blocks: [
              {
                block_num: 1000,
                block_timestamp: timestamp / 1000,
              },
            ],
          },
        });
      },
    ),
  ];
};
