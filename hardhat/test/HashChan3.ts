import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isAddress } from "viem";

import { network } from "hardhat";
import { setupHashChan3Fixtures } from "./utils/index.js";

const { provider, networkHelpers, viem } = await network.create();
const { deployAll } = setupHashChan3Fixtures(provider, viem);

describe("HashChan3", function () {
  it("deploys HashChan3, ModerationServiceFactory and a ModerationService", async function () {
    const { HashChan3, ModerationServiceFactory, modService } =
      await networkHelpers.loadFixture(deployAll);

    assert.ok(isAddress(HashChan3.address));
    assert.ok(isAddress(ModerationServiceFactory.address));
    assert.ok(isAddress(modService.address));
  });

  it("should have a NewBoard event", async function () {
    const { env, HashChan3 } = await networkHelpers.loadFixture(deployAll);

    const newBoardEvents = await env.viem.publicClient.getContractEvents({
      address: HashChan3.address,
      abi: HashChan3.abi,
      eventName: "NewBoard",
      fromBlock: 0n,
    });

    assert.ok(newBoardEvents.length > 0);
    assert.ok((newBoardEvents[0].args.rules?.length ?? 0) > 0);
  });

  it("comes with a board", async function () {
    const { env, HashChan3 } = await networkHelpers.loadFixture(deployAll);

    const board = await env.viem.publicClient.readContract({
      address: HashChan3.address,
      abi: HashChan3.abi,
      functionName: "getBoard",
      args: [0n],
    });

    assert.ok(board.rules.length > 0);
  });

  it("creates a thread", async function () {
    const { env, HashChan3, namedAccounts } =
      await networkHelpers.loadFixture(deployAll);

    const hashChan3AsDeployer = env.viem.getWritableContract(HashChan3, {
      account: namedAccounts.deployer,
    });

    const args = {
      boardId: 0n,
      title: "title",
      imgUrl: "https://image.com/image.png",
      imgCID: "bafkreib7cvtqy5exmymnm32hksayaok7ywf5lsoz3xglipfnverpdgmrki",
      content: "This is a short thread",
    };

    const hash = await hashChan3AsDeployer.write.createThread(
      Object.values(args),
    );
    const receipt = await env.viem.publicClient.waitForTransactionReceipt({
      hash,
    });

    const newThreadEvents = await env.viem.publicClient.getContractEvents({
      address: HashChan3.address,
      abi: HashChan3.abi,
      eventName: "NewThread",
      fromBlock: 0n,
    });

    assert.ok(receipt.logs.length > 0);
    assert.ok(newThreadEvents.length > 0);
    const lastEvent = newThreadEvents[newThreadEvents.length - 1];
    assert.equal(lastEvent.args.boardId, args.boardId);
    assert.equal(lastEvent.args.title, args.title);
    assert.equal(lastEvent.args.imgUrl, args.imgUrl);
    assert.equal(lastEvent.args.imgCID, args.imgCID);
    assert.equal(lastEvent.args.content, args.content);
  });

  it("creates a post", async function () {
    const { env, HashChan3, namedAccounts } =
      await networkHelpers.loadFixture(deployAll);

    const hashChan3AsDeployer = env.viem.getWritableContract(HashChan3, {
      account: namedAccounts.deployer,
    });

    const threadHash = await hashChan3AsDeployer.write.createThread([
      0n,
      "title",
      "https://image.com/image.png",
      "bafkreib7cvtqy5exmymnm32hksayaok7ywf5lsoz3xglipfnverpdgmrki",
      "This is a short thread",
    ]);
    await env.viem.publicClient.waitForTransactionReceipt({
      hash: threadHash,
    });

    const [threadEvent] = await env.viem.publicClient.getContractEvents({
      address: HashChan3.address,
      abi: HashChan3.abi,
      eventName: "NewThread",
      fromBlock: 0n,
    });
    const threadId = threadEvent.args.threadId as `0x${string}`;

    const args = {
      boardId: 0n,
      threadId,
      replyIds: [threadId],
      imgUrl: "https://image.com/image.png",
      imgCID: "bafkreib7cvtqy5exmymnm32hksayaok7ywf5lsoz3xglipfnverpdgmrki",
      content: "This is a short post",
    };

    const hash = await hashChan3AsDeployer.write.createPost(
      Object.values(args),
    );
    const receipt = await env.viem.publicClient.waitForTransactionReceipt({
      hash,
    });

    assert.ok(receipt.logs.length > 0);

    const newPostEvents = await env.viem.publicClient.getContractEvents({
      address: HashChan3.address,
      abi: HashChan3.abi,
      eventName: "NewPost",
      fromBlock: 0n,
    });
    assert.ok(newPostEvents.length > 0);
    const lastEvent = newPostEvents[newPostEvents.length - 1];
    assert.equal(lastEvent.args.threadId, args.threadId);
    assert.equal(lastEvent.args.content, args.content);
  });

  it("creates a moderation service", async function () {
    const { modService } = await networkHelpers.loadFixture(deployAll);

    assert.equal(await modService.read.name(), "Basic Service");
    assert.equal(await modService.read.uri(), "orbit.hashchan.org");
    assert.equal(await modService.read.port(), 443n);
  });

  it("adds a janitor", async function () {
    const { modService, namedAccounts } =
      await networkHelpers.loadFixture(deployAll);

    const janitor = await modService.read.getJanitor([
      namedAccounts.deployer,
    ]);
    assert.notEqual(janitor.started, 0n);
  });

  it("lets a janitor flag a post, and the mod service owner review the flag", async function () {
    const { env, HashChan3, modService, namedAccounts } =
      await networkHelpers.loadFixture(deployAll);
    const { deployer } = namedAccounts;

    const hashChan3AsDeployer = env.viem.getWritableContract(HashChan3, {
      account: deployer,
    });
    const threadHash = await hashChan3AsDeployer.write.createThread([
      0n,
      "title",
      "https://image.com/image.png",
      "bafkreib7cvtqy5exmymnm32hksayaok7ywf5lsoz3xglipfnverpdgmrki",
      "This is a short thread",
    ]);
    await env.viem.publicClient.waitForTransactionReceipt({
      hash: threadHash,
    });
    const [threadEvent] = await env.viem.publicClient.getContractEvents({
      address: HashChan3.address,
      abi: HashChan3.abi,
      eventName: "NewThread",
      fromBlock: 0n,
    });
    const threadId = threadEvent.args.threadId as `0x${string}`;

    const postHash = await hashChan3AsDeployer.write.createPost([
      0n,
      threadId,
      [threadId],
      "https://image.com/image.png",
      "bafkreib7cvtqy5exmymnm32hksayaok7ywf5lsoz3xglipfnverpdgmrki",
      "This is a short post",
    ]);
    await env.viem.publicClient.waitForTransactionReceipt({ hash: postHash });
    const [postEvent] = await env.viem.publicClient.getContractEvents({
      address: HashChan3.address,
      abi: HashChan3.abi,
      eventName: "NewPost",
      fromBlock: 0n,
    });
    const postId = postEvent.args.postId as `0x${string}`;

    const chainId = await env.viem.publicClient.getChainId();
    const typedData = {
      domain: {
        name: "Basic Service",
        version: "1",
        chainId,
        verifyingContract: modService.address,
      },
      message: {
        chainId: BigInt(chainId),
        boardId: 0n,
        threadId,
        postId,
        reason: 0n,
      },
      primaryType: "FlagData" as const,
      types: {
        EIP712Domain: [
          { name: "name", type: "string" },
          { name: "version", type: "string" },
          { name: "chainId", type: "uint256" },
          { name: "verifyingContract", type: "address" },
        ],
        FlagData: [
          { name: "chainId", type: "uint256" },
          { name: "boardId", type: "uint256" },
          { name: "threadId", type: "bytes32" },
          { name: "postId", type: "bytes32" },
          { name: "reason", type: "uint256" },
        ],
      },
    };

    // deployer is the janitor added by the fixture; it signs the flag.
    const janitorWallet = await viem.getWalletClient(deployer);
    const flagSig = await janitorWallet.signTypedData(typedData);

    // modService is bound to admin (the mod service owner), which reviews
    // the janitor's flag and pays out the tip.
    const hash = await modService.write.addReview(
      [
        deployer,
        true,
        "thanks for the flag",
        flagSig,
        {
          chainId: BigInt(chainId),
          boardId: 0n,
          threadId,
          postId,
          reason: 0n,
        },
      ],
      { value: 100n },
    );
    await env.viem.publicClient.waitForTransactionReceipt({ hash });

    const jannyData = await modService.read.getJanitor([deployer]);
    assert.equal(jannyData.positiveReviews, 1n);
    assert.equal(jannyData.negativeReviews, 0n);
    assert.equal(jannyData.claimedWages, 95n);

    assert.equal(await modService.read.totalWages(), 100n);
    assert.equal(await modService.read.ownerWages(), 5n);
  });

  it("rejects an owner fee rate above the 20% cap", async function () {
    const { modService } = await networkHelpers.loadFixture(deployAll);

    await viem.assertions.revertWith(
      modService.write.setOwnerFeeRate([2001n]),
      "owner fee rate too high",
    );
  });
});
