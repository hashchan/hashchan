import {ignition, network, viem} from 'hardhat'

import { expect } from "chai";
import "@nomicfoundation/hardhat-chai-matchers";

import {loadFixture} from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import HashChan3Module from "../ignition/modules/HashChan3";

import { getAddress } from 'viem'

import { createPublicClient, custom } from "viem";
describe("HashChan3", function () {
  let hashChan3: any
  let modServiceFactory: any
  let exampleModerationService: any
  let publicClient: any
  let threadId: `0x${string}`
  let postId: `0x${string}`
  let deployer: any;
  let poster: any;
  let moderator: any;
  let janny: any;
  let flagSig: any;
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
        boardId: 0n,
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
      threadId = newThreadEvents[0].args.threadId as `0x${string}`
    })

    it("should create a post", async () => {
      const { publicClient, hashChan3 } = await loadFixture(deployFixture)
      const args = {
        boardId: 0n,  
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

      postId = newPostEvents[0].args.postId as `0x${string}`
    })

    it("should create a moderation service", async () => {
      const name = "Example Moderation Service"
      const url = "orbit.hashchan.org"
      const port = 81
      const hash = await modServiceFactory.write.createModerationService([name, url, port])
      const receipt =  await publicClient.waitForTransactionReceipt({ hash })

      const newModerationServiceEvents = await publicClient.getContractEvents({
        address: modServiceFactory.address,
        abi: modServiceFactory.abi,
        eventName: "NewModerationService",
        fromBlock: 0n
      })
      expect(newModerationServiceEvents.length).to.be.greaterThan(0)
      expect(newModerationServiceEvents[0].args.name).to.deep.contain(name)

      exampleModerationService = await viem.getContractAt(
        "ModerationService",
        newModerationServiceEvents[0].args.moderationService
      )

      const modName = await exampleModerationService.read.name()
      expect(modName).to.deep.contain(name)


    })

    it("should add a janitor", async () => {
      const hash = await exampleModerationService.write.addJanitor([
        janny.account.address
      ])
      await publicClient.waitForTransactionReceipt({ hash })

      const newJanitorEvents = await publicClient.getContractEvents({
        address: exampleModerationService.address,
        abi: exampleModerationService.abi,
        eventName: "NewJanitor",
        fromBlock: 0n
      })

      expect(newJanitorEvents.length).to.be.greaterThan(0)
      expect(
        getAddress(newJanitorEvents[0].args.janitor)
      ).to.be.equal(getAddress(janny.account.address))
    })

    it("janitor can flag a post", async () => {

      const typedData = {
        domain: {
          name: "Example Moderation Service",
          version: "1",
          chainId: await publicClient.getChainId(),
          verifyingContract: exampleModerationService.address
        },
        message: {
          chainId: await publicClient.getChainId(),
          boardId: 0n,
          threadId: threadId,
          postId: postId,
          reason: 0n
        },
        primaryType: "FlagData",
        types: {
          EIP712Domain: [
            {name: "name", type: "string"},
            {name: "version", type: "string"},
            {name: "chainId", type: "uint256"},
            {name: "verifyingContract", type: "address"}
          ],
          FlagData: [
            {name: "chainId", type: "uint256"},
            {name: "boardId", type: "uint256"},
            {name: "threadId", type: "bytes32"},
            {name: "postId", type: "bytes32"},
            {name: "reason", type: "uint256"}
          ]
        }
      } 


      const signature = await janny.signTypedData(typedData)
      console.log('signature', signature)
      flagSig = signature
    })

    it("a lurker can review a janitors flag", async () => {
      const hash = await exampleModerationService.write.addReview([
        janny.account.address,
        true,
        "thanks for the flag",
        flagSig,
        {
          chainId: await publicClient.getChainId(),
          boardId: 0n,
          threadId: threadId,
          postId: postId,
          reason: 0n
        }
      ], {
        value: 10n
      })
      const receipt = await publicClient.waitForTransactionReceipt({ hash })

      const jannyData = await exampleModerationService.read.getJanitor([janny.account.address])
      console.log('jannyData', jannyData)
      expect(jannyData).to.deep.contain({
        positiveReviews: 1n,
        negativeReviews: 0n,
        claimedWages: 10n
      })
    })
  })
})
