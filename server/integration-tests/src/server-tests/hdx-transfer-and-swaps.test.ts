import { describe } from "@jest/globals";
import { VerifyResponse } from "./verify-response";

const url =
  "http://127.0.1:3001/api/payments/hydration/5CFwQqMnG61MkaSS96tW9vU2JiaV2YPHve2EtFA5SgY4SAts?startdate=1746914400000&enddate=1747087199000&currency=USD";
describe(
  "should fetch hydration swap and transfers",
  new VerifyResponse().createTest(
    "should fetch hydration swap and transfers",
    url,
    "hydration_transfers_and_swaps.json",
    "recording_hydration_transfers_and_swaps.json",
  ),
);
