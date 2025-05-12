import { setupServer, SetupServerApi } from "msw/node";
import { polkataxServer } from "../../../src/server/polkatax-server";
import { getReplayTrafficHandlers } from "../util/get-replay-traffic-handlers";
import fs from "fs";
import { afterEach, beforeEach, expect, test } from "@jest/globals";
import { FastifyInstance } from "fastify";

export class VerifyResponse {
  server: SetupServerApi;
  fastiyInstance: FastifyInstance;

  verifyEquals(json: any, fileName: string) {
    const expectedBody = fs.readFileSync(
      __dirname + "/../../res/" + fileName,
      "utf-8",
    );
    expect(json).toEqual(JSON.parse(expectedBody));
  }

  async verifyResponse(url: string, responseFile: string, recording: string) {
    process.env["SUBSCAN_API_KEY"] = "made-up-key";

    this.server = setupServer(
      ...getReplayTrafficHandlers(__dirname + "/../../res/" + recording),
    );
    this.server.listen();

    this.fastiyInstance = await polkataxServer.init();

    const response = await fetch(url);
    const jsonBody = await response.json();
    this.verifyEquals(jsonBody, responseFile);
  }

  async close() {
    if (this.server) {
      this.server.resetHandlers();
      this.server.close();
    }
    if (this.fastiyInstance) {
      await this.fastiyInstance.close();
    }
  }

  createTest(
    testTitle: string,
    url: string,
    expectedResponseFile: string,
    recordingsFile: string,
  ) {
    return () => {
      test(testTitle, async () => {
        await this.verifyResponse(url, expectedResponseFile, recordingsFile);
      });

      afterEach(async () => {
        await this.close();
      });
    };
  }
}
