import {
  bypass,
  http,
  HttpResponse,
  JsonBodyType,
  passthrough,
  StrictRequest,
} from "msw";
import { setupServer } from "msw/node";
import { polkataxServer } from "../../src/server/polkatax-server";
import fs from "fs";
import { startStub as startPricesStub } from "../../src/crypto-currency-prices/stub";
import { startStub as startFiatStub } from "../../src/fiat-exchange-rates/stub";

const req_and_resp_list = [];
const fileName = Math.random().toString(36).replace("0.", "") + ".json";

const record = async (request: StrictRequest<JsonBodyType>) => {
  console.log("Incoming request: " + request.url);
  const response = await fetch(bypass(request));
  const txt = await response.text();
  const reqBody = await request.text();
  req_and_resp_list.push({
    req: request.url + "|" + request.method + "|" + reqBody,
    resp: txt,
  });
  store(req_and_resp_list, fileName);
  return HttpResponse.json(JSON.parse(txt));
};

const store = (recordings, fileName) => {
  fs.writeFileSync(
    __dirname + "/../_recordings_/" + fileName,
    JSON.stringify(recordings),
  );
};

const handlers = ["post", "get"].map((method) =>
  http[method]("*", async ({ request }) => {
    if (request.url.startsWith("http://127.0.0.1:3001")) {
      return passthrough();
    }
    return record(request);
  }),
);

const server = setupServer(...handlers);

server.listen();

polkataxServer.init();
startPricesStub();
startFiatStub();

console.log("");
console.log("==================================================");
console.log("Recording traffic in file " + fileName);
console.log("==================================================");
console.log("");
