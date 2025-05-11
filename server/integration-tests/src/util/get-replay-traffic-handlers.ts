import fs from "fs";
import {
  http,
  HttpResponse,
  JsonBodyType,
  passthrough,
  StrictRequest,
} from "msw";

export const getReplayTrafficHandlers = (filePath) => {
  const req_and_resp_list: { req: string; resp: string }[] = JSON.parse(
    fs.readFileSync(filePath, "utf-8"),
  );

  const replay = async (request: StrictRequest<JsonBodyType>) => {
    const reqBody = await request.text();
    const response = req_and_resp_list.find(
      (r) => r.req === request.url + "|" + request.method + "|" + reqBody,
    );
    if (!response) {
      console.error(
        request.url + "|" + request.method + "|" + reqBody + " not found.",
      );
    }
    return HttpResponse.json(JSON.parse(response.resp));
  };

  return ["post", "get"].map((method) =>
    http[method]("*", async ({ request }) => {
      if (request.url.startsWith("http://localhost:3001")) {
        return passthrough();
      }
      return replay(request);
    }),
  );
};
