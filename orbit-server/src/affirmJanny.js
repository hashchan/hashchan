import {
  publicClient,
  modServiceInstance,
  walletClient
} from './src/config.js'

export const affirmJanny = async ({
  janitor,
  postId,
  signature
}) => {
  const typedData = {
    domain: {
      name: await modServiceInstance.read.name(),
      version: '1',
      chainId: await publicClient.getChainId()
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

  const affirmSig =  await walletClient.signTypedData(typedData)
  console.log('affirm Sig', affirmSig)
  return affirmSig
}
