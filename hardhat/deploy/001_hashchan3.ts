
export default async function ({viem}) {
  console.log(viem);
  const [deployer, modServiceOwner] = await viem.getWalletClients()
  const publicClient = await viem.getPublicClient();

  console.log(deployer.account.address, modServiceOwner.account.address); 

  const hashChan3 = await viem.deployContract("HashChan3", [
    
  ]);

  console.log(hashChan3.address);

  const moderationServiceFactory = await viem.deployContract("ModerationServiceFactory", [
    hashChan3.address
  ]);

  console.log(moderationServiceFactory.address);

  const instance = await viem.getContractAt(
    "ModerationServiceFactory",
    moderationServiceFactory.address,
    {
      client: { wallet: modServiceOwner }
    }
  );

  const createServiceHash = await instance.write.createModerationService([
   "Basic Service",
   "orbit.hashchan.org",
   "443"
  ])

  const tx = await publicClient.waitForTransactionReceipt({ hash: createServiceHash });
  console.log(tx);



}
