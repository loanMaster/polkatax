import { http, HttpResponse } from "msw";

export const scanTokenHandler = http.post(
  "https://*.api.subscan.io/api/scan/token",
  async ({ request }): Promise<HttpResponse<{ data: any }>> => {
    return HttpResponse.json({
      data: {
        detail: { DOT: { asset_type: "native", token_decimals: "10" } },
      },
    });
  },
);
