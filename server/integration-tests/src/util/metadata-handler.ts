import { http, HttpResponse } from "msw";
import { MetaData } from "../../../src/server/blockchain/substrate/model/meta-data";

export const metaDataHandler = http.post(
  "https://*.api.subscan.io/api/scan/metadata",
  async ({ request }): Promise<HttpResponse<{ data: MetaData }>> => {
    return HttpResponse.json({
      data: {
        avgBlockTime: 6,
        blockNum: 1000,
      },
    });
  },
);
