export const getNearestBlock = async (
  endpoint: string,
  apiKey: string,
  date: Date,
  closest: "before" | "after",
): Promise<number> => {
  const response = await fetch(
    `${endpoint}?module=block&action=getblocknobytime&timestamp=${Math.floor(date.getTime() / 1000)}&closest=${closest}&apikey=${apiKey}`,
  );
  let json = await response.json();
  return json.result.blockNumber || json.result;
};
