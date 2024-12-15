import {
  publicClient,
  modServiceInstance,
  walletClient
} from './config.js'

export const affirmJanny = async ({
  janitor,
  postId,
  signature
}) => {
  console.log('janitor', janitor)
  console.log('postId', postId)
  console.log('signature', signature)
  console.log('name', await modServiceInstance.read.name())

  const affirmData = {
    domain: {
      name: await modServiceInstance.read.name(),
      version: '1',
      chainId: await publicClient.getChainId(),
      verifyingContract: process.env.MOD_SERVICE_ADDRESS
    },
    message: {
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
        {name: "janitor", type: "address"},
        {name: "postId", type: "bytes32"},
        {name: "signature", type: "bytes"},
      ]
    }
  }
  console.log('walletClient', walletClient)
  const affirmSig =  await walletClient.signTypedData(affirmData)
  console.log('affirm Sig', affirmSig)
  return {affirmData, affirmSig}
}
