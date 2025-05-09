import * as fs from "fs";
import * as coingeckoTokens from "./res/coingecko-tokens.json";
import { normalizeTokenName } from "./src/server/blockchain/evm/util/normalize-token-name";

if (fs.existsSync("./res/gen/hydration-tokens.json")) {
  console.log("exists");
}

const contents = fs.readFileSync("./res/gen/hydration-tokens.json", "utf-8");
let sanitized = contents.replace(/[\u0000-\u001F\u007F]/g, "");
const parsed = JSON.parse(sanitized);
// console.log(tokensBefore.length);
// const tokens = tokensBefore.filter((t) => !!t.name);
// console.log(tokens.length);
const result = [];
for (let token of parsed.data.tokens) {
  const matches = (coingeckoTokens as any).default.filter(
    (c) => c.symbol === token.symbol.toLowerCase(),
  );
  if (matches.length === 1) {
    result.push({
      symbol: token.symbol,
      name: token.name,
      coingeckoId: matches[0].id,
    });
    continue;
  }
  if (matches.length > 1) {
    const perfectMatch = matches.find((m) => m.name === token.name);
    if (perfectMatch) {
      result.push({
        symbol: token.symbol,
        name: token.name,
        coingeckoId: perfectMatch.id,
      });
      continue;
    }
  }
  result.push({
    symbol: token.symbol,
    name: token.name,
    coingeckoId: undefined,
  });
}
fs.writeFileSync(
  "./res/gen/hydration-tokens-to-gecko.json",
  JSON.stringify({ tokens: result }),
);
