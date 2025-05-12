import { describe } from "@jest/globals";
import { VerifyResponse } from "./verify-response";

const url =
  "http://127.0.0.1:3001/api/staking-rewards/kusama/5GeJMTfNpe2mmJgnxHoYJDVvNFcn8X4fbdtVPHVonFSX9tH7?startdate=1704063600000&enddate=1735686000000&currency=USD";
describe(
  "ksm staking rewards 2024",
  new VerifyResponse().createTest(
    "ksm staking rewards 2024",
    url,
    "staking_rewards_ksm_2024.json",
    "recording_for_staking_rewards_ksm_2024.json",
  ),
);
