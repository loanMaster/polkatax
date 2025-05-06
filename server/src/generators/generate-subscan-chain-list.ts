import { parse } from "node-html-parser";
import "node-fetch";
import * as fs from "fs";
import * as substrateTokenToCoingeckoId from "../../res/substrate-token-to-coingecko-id.json";
import dotenv from "dotenv";
dotenv.config({ path: __dirname + "/../../.env" });
import { SubscanApi } from "../server/blockchain/substrate/api/subscan.api";

const determineTokenAndChainName = async (domain) => {
  const response = await fetch(`https://${domain}.subscan.io/`);
  const html = await response.text();
  const document = parse(html);
  const logo = document.querySelectorAll("[data-testid=chain-switcher] img")[0];
  const label = logo.getAttribute("alt");
  const runtimeLink = document.querySelector('[href="/runtime"]');
  const token = runtimeLink.parentNode.nextElementSibling.firstChild.innerText;
  return { label, token };
};

const fetchListOfSupportedChains = async () => {
  const response = await fetch("https://support.subscan.io/");
  const html = await response.text();
  const document = parse(html);
  const apis = document.querySelectorAll("table code");
  const result = [];
  console.log("Found " + apis.length + " chains.");
  for (let endpointElement of apis) {
    const domain = endpointElement.innerText.split(".")[0];
    console.log("Processing " + domain);
    try {
      const { label, token } = await determineTokenAndChainName(domain);
      const runtimeMetadata = await fetchRuntimeMetadata(domain);
      const pallets = runtimeMetadata.info.metadata.map((m) => m.name);
      result.push({
        domain,
        label,
        token,
        stakingPallets: pallets.filter(
          (name) => name.toLowerCase().indexOf("staking") > -1,
        ),
        evmPallet: pallets.indexOf("EVM") > -1,
        standardStaking: pallets.indexOf("Staking") > -1,
        parachainStaking: pallets.indexOf("ParachainStaking") > -1,
        delegatedStaking: pallets.indexOf("DelegatedStaking") > -1,
      });
      console.log("Done processing " + domain);
    } catch (error) {
      console.error(
        "An error occured fetching chain name and token. Website might be not reachable or has no token.",
        error,
      );
    }
  }
  console.log("Finished.");
  return result;
};

const verifySubstrateToCoingeckoIdMapping = (
  chains: { token: string; label: string }[],
) => {
  chains.forEach((chain) => {
    if (
      !substrateTokenToCoingeckoId.tokens.find(
        (entry) => entry.token === chain.token,
      )
    ) {
      console.info(
        `No mapping for ${chain.token} (${chain.label}) found in substrate-token-to-coingecko-id.json`,
      );
    }
  });
  substrateTokenToCoingeckoId.tokens.forEach((entry) => {
    if (chains.map((c) => c.token).indexOf(entry.token) === -1) {
      console.info(
        `Mapping for ${entry.token} found in substrate-token-to-coingecko-id.json but it's not found in subscan-chains.json`,
      );
    }
  });
};

const fetchRuntimeMetadata = async (domain: string) => {
  return new SubscanApi().fetchRuntimeMetadata(domain);
};

fetchListOfSupportedChains().then(async (chains) => {
  console.log(JSON.stringify(chains));
  console.log("Writing file...");
  fs.writeFileSync(
    __dirname + "/../../res/gen/subscan-chains.json",
    JSON.stringify({ chains }, undefined, 4),
  );

  console.log(
    "Verifying completeness of subscan token to coingecko id mapping",
  );
  verifySubstrateToCoingeckoIdMapping(chains);
});
