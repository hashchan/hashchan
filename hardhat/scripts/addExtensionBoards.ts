import hre from "hardhat";
import { loadEnvironmentFromHardhat } from "../rocketh/environment.js";
import * as artifacts from "../generated/artifacts/index.js";

// Creates the boards the browser extension expects to find (see
// extension/src/components/PageThread.tsx's SITE_BOARD_MAP) on whatever
// network HashChan3 is already deployed to. Symbols must be <= 4 bytes
// (enforced on-chain by HashChan3.createBoard).
// Run: `pnpm hardhat run scripts/addExtensionBoards.ts --network <network>`
const ipfsGateway = "https://communist-azure-rooster.myfilebase.com/ipfs";
const onTopicRule = "Keep content related to the linked page.";

const BOARDS = [
  {
    name: "YouTube",
    symbol: "yt",
    description: "Decentralized discussion threads for YouTube videos.",
    bannerCID: "QmXhyvueu9bKriT4uxJ6Qkw2zZoKHu4YukNkA4KRXvmeN4",
    rules: [onTopicRule],
  },
  {
    name: "Wikipedia",
    symbol: "wiki",
    description: "Decentralized discussion threads for Wikipedia articles.",
    bannerCID: "QmeB6Cv9S8MhDz9Wp2Sb2vma9FzVG3CHnorLGfBdLW4ZJ1",
    rules: [onTopicRule],
  },
  {
    name: "Rotten Tomatoes",
    symbol: "rt",
    description: "Decentralized discussion threads for Rotten Tomatoes pages.",
    bannerCID: "QmNn8MnqFpyWbXsNhEecKwCj2XrSSQSEddsKtRm1qKhjkX",
    rules: [onTopicRule],
  },
  {
    name: "Reddit",
    symbol: "rdt",
    description: "Decentralized discussion threads for Reddit posts.",
    bannerCID: "QmSZGyeDYnvRa4kvBYGyc2SbV5iYBwPWLTTS8XZvZgCU6E",
    rules: [onTopicRule],
  },
  {
    name: "X",
    symbol: "x",
    description: "Decentralized discussion threads for X (Twitter) posts.",
    bannerCID: "Qmdn6EqGMv5wZ6TYTt7dqu3cRJEn6Ce2NuSpK61fGbDTLU",
    rules: [onTopicRule],
  },
].map(board => ({ ...board, bannerUrl: `${ipfsGateway}/${board.bannerCID}` }));

const env = await loadEnvironmentFromHardhat({ hre });
const HashChan3 = env.get<typeof artifacts.HashChan3.abi>("HashChan3");
const { deployer } = env.namedAccounts;

const hashchan = env.viem.getWritableContract(HashChan3, {
  account: deployer,
});

const boardCount = await hashchan.read.boardCount();
const existingSymbols = new Set<string>();
for (let i = 0n; i < boardCount; i++) {
  const board = await hashchan.read.getBoard([i]);
  existingSymbols.add(board.symbol);
}

for (const board of BOARDS) {
  if (existingSymbols.has(board.symbol)) {
    console.log(`skip /${board.symbol}/ - already exists`);
    continue;
  }

  try {
    const hash = await hashchan.write.createBoard([
      board.name,
      board.symbol,
      board.description,
      board.bannerUrl,
      board.bannerCID,
      board.rules,
    ]);
    await env.viem.publicClient.waitForTransactionReceipt({ hash });
    console.log(`created /${board.symbol}/ - ${hash}`);
  } catch (e) {
    console.log(`failed /${board.symbol}/ - ${(e as Error).message}`);
  }
}
