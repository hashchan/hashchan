import {ignition, network, viem} from 'hardhat'

import { expect } from "chai";
import "@nomicfoundation/hardhat-chai-matchers";

import {loadFixture} from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";

import HashChan3Module from "../ignition/modules/HashChan3";

import { createPublicClient, custom } from "viem";
describe("HashChan3", function () {
  let hashChan3: any
  let modServiceFactory: any
  let publicClient: any
  let threadId: `0x${string}`
  let postId: `0x${string}`
  let deployer;
  let poster;
  let moderator;
  let janny;
  beforeEach(async () => {
    ;([deployer, poster, moderator, janny] = await viem.getWalletClients())
    ;({hashChan3, modServiceFactory} = await ignition.deploy(HashChan3Module))

    publicClient = createPublicClient({
      transport: custom(network.provider),
    })
  })


  async function deployFixture() {
    const {
      hashChan3,
      modServiceFactory
    } = await ignition.deploy(HashChan3Module)

    const publicClient = createPublicClient({
      transport: custom(network.provider),
    })
    // Get the deployed contracts
    return {
      hashChan3,
      modServiceFactory,
      publicClient
    }
  }

  describe("Hashchan3", async () => {
    it("Should be deployed", async () => {
      //const { hashChan3, modServiceFactory } = await loadFixture(deployFixture)

      expect(hashChan3.address).to.be.properAddress
      expect(modServiceFactory.address).to.be.properAddress
    })

    it("should have a newBoard Event", async () => {
      const newBoardEvents = await publicClient.getContractEvents({
        address: hashChan3.address,
        abi: hashChan3.abi,
        eventName: "NewBoard",
        fromBlock: 0n
      })
      expect(newBoardEvents.length).to.be.greaterThan(0)

      expect(newBoardEvents[0].args.rules.length).to.be.greaterThan(0)

    })

    it("come with a board", async () => {
      const board = await hashChan3.read.getBoard([0n])
      expect(board.rules.length).to.be.greaterThan(0)
    })

    it("create a thread", async () => {
      const { publicClient, hashChan3, modServiceFactory } = await loadFixture(deployFixture)

      const args = {
        board: 0n,
        title: "title",
        imgUrl: "https://image.com/image.png",
        imgCID: "bafkreib7cvtqy5exmymnm32hksayaok7ywf5lsoz3xglipfnverpdgmrki",
        content: "This is a short thread"
      }

      const hash = await hashChan3.write.createThread(Object.values(args))

      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      const newThreadEvents = await publicClient.getContractEvents({
        address: hashChan3.address,
        abi: hashChan3.abi,
        eventName: "NewThread",
        fromBlock: 0n
      })

      expect(receipt.logs.length).to.be.greaterThan(0)
      expect(newThreadEvents.length).to.be.greaterThan(0)
      expect(newThreadEvents[0].args).to.deep.contain(args)
      threadId = newThreadEvents[0].args.id as `0x${string}`
    })

    it("should create a post", async () => {
      const { publicClient, hashChan3 } = await loadFixture(deployFixture)
      const args = {
        board: 0n,  
        threadId: threadId,
        replyIds: [threadId],
        imgUrl: "https://image.com/image.png",
        imgCID: "bafkreib7cvtqy5exmymnm32hksayaok7ywf5lsoz3xglipfnverpdgmrki",
        content: "This is a short post"
      }
      const hash = await hashChan3.write.createPost(Object.values(args))
      const receipt = await publicClient.waitForTransactionReceipt({ hash })
      expect(receipt.logs.length).to.be.greaterThan(0)

      const newPostEvents = await publicClient.getContractEvents({
        address: hashChan3.address,
        abi: hashChan3.abi,
        eventName: "NewPost",
        fromBlock: 0n
      })
      expect(newPostEvents.length).to.be.greaterThan(0)
      expect(newPostEvents[0].args).to.deep.contain(args)

      postId = newPostEvents[0].args.id as `0x${string}`
    })

    it("should create a moderation service")
  })
})
