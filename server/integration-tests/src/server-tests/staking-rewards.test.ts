import { setupServer, SetupServerApi } from "msw/node";
import { polkataxServer } from "../../../src/server/polkatax-server";
import { getReplayTrafficHandlers } from "../util/get-replay-traffic-handlers";
import { afterEach, describe, expect, test } from "@jest/globals";
import fs from "fs";

const verifyEquals = (json: any, fileName: string) => {
  const expectedBody = fs.readFileSync(
    __dirname + "/../../res/" + fileName,
    "utf-8",
  );
  expect(json).toEqual(JSON.parse(expectedBody));
};

let server: SetupServerApi;
let fastiyInstance;

describe("should fetch staking rewards", () => {
  test("ksm staking rewards 2024", async () => {
    server = setupServer(
      ...getReplayTrafficHandlers(
        __dirname +
          "/../../res/" +
          "recording_for_staking_rewards_ksm_2024.json",
      ),
    );
    server.listen();

    fastiyInstance = await polkataxServer.init(3001);

    const response = await fetch(
      "http://127.0.0.1:3001/api/staking-rewards/kusama/5GeJMTfNpe2mmJgnxHoYJDVvNFcn8X4fbdtVPHVonFSX9tH7?startdate=1704063600000&enddate=1735686000000&currency=USD",
    );
    const jsonBody = await response.json();
    verifyEquals(jsonBody, "staking_rewards_ksm_2024.json");
  });
});

afterEach(() => {
  if (server) {
    server.resetHandlers();
    server.close();
  }
  if (fastiyInstance) {
    fastiyInstance.close();
  }
});
