import { network, viem} from 'hardhat'
import hre from 'hardhat'
import { expect } from "chai";
import "@nomicfoundation/hardhat-chai-matchers";

import {loadFixture} from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
//import HashChan3Module from "../ignition/modules/HashChan3";
import deploy from "../deploy/001_hashchan3";

import { getAddress } from 'viem'

import { createPublicClient, custom } from "viem";
describe("HashChan3", function () {
  let hashChan3: any
  let modServiceFactory: any
  let modService: any
  let publicClient: any
  let threadId: `0x${string}`
  let postId: `0x${string}`
  let deployer: any;
  let poster: any;
  let moderator: any;
  let janny: any;
  let flagSig: any;
  before(async () => {
    ;([deployer, moderator] = await viem.getWalletClients())
    ;({ hashChan3, modServiceFactory, modService } = await deploy(hre))
    
    publicClient = createPublicClient({
      transport: custom(network.provider),
    })
  })

  describe("Hashchan3", async () => {
    it("Should be deployed", async () => {
      expect(hashChan3.address).to.be.properAddress
      expect(modServiceFactory.address).to.be.properAddress
      expect(modService.address).to.be.properAddress
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

      const modName = await modService.read.name()
      expect(modName).to.deep.contain('Basic Service')

      const modUrl = await modService.read.uri()
      expect(modUrl).to.deep.contain('orbit.hashchan.org')

      const modPort = await modService.read.port()
      expect(Number(modPort)).to.be.equal(443)


    })

    it("should add a janitor", async () => {
      const janitor = await modService.read.getJanitor([
        deployer.account.address
      ])
      console.log('janitor', janitor);
    })

    it("janitor can flag a post", async () => {
      console.log('modService.address', modService.address);
      const typedData = {
        domain: {
          name: "Basic Service",
          version: "1",
          chainId: await publicClient.getChainId(),
          verifyingContract: modService.address
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


      const signature = await deployer.signTypedData(typedData)
      console.log('signature', signature)
      flagSig = signature
    })

    it("a lurker can review a janitors flag", async () => {
      console.log('janitor', deployer.account.address);
      console.log('modService.address', modService.address);
      const hash = await modService.write.addReview([
        deployer.account.address,
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

      const jannyData = await modService.read.getJanitor([deployer.account.address])
      console.log('jannyData', jannyData)
      expect(jannyData).to.deep.contain({
        positiveReviews: 1n,
        negativeReviews: 0n,
        claimedWages: 10n
      })
    })
  })
})
