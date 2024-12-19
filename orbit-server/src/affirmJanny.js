import {
  account,
  publicClients,
  instances,
  walletClients,
} from './config.js'
import  ModerationService from './abi/ModerationService.json' with {type: "json"}

export const affirmJanny = async ({
  janitor,
  postId,
  signature,
  chainId
}) => {
  console.log('janitor', janitor)
  console.log('postId', postId)
  console.log('signature', signature)
  const affirmData = {
    domain: {
      name: await instances[chainId].read.name(),
      version: '1',
      chainId: chainId,
      verifyingContract: ModerationService[Number(chainId)].address
    },
    message: {
      moderator: account.address,
      janitor,
      postId,
      signature
    },
    primaryType: 'Affirmation',
    types: {
      EIP712Domain: [
        {name: "name", type: "string"},
        {name: "version", type: "string"},
        {name: "chainId", type: "uint256"},
        {name: "verifyingContract", type: "address"},
      ],
      Affirmation: [
        {name: "moderator", type: "address"},
        {name: "janitor", type: "address"},
        {name: "postId", type: "bytes32"},
        {name: "signature", type: "bytes"},
      ]
    }
  }
  const affirmSig =  await walletClients[chainId].signTypedData(affirmData)
  console.log('affirm Sig', affirmSig)
  return {affirmData, affirmSig}
}
