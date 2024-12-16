
export default async function ({viem}) {
  //console.log(viem);
  const [deployer, modServiceOwner] = await viem.getWalletClients()
  const publicClient = await viem.getPublicClient();

  console.log(deployer.account.address, modServiceOwner.account.address); 

  const hashChan3 = await viem.deployContract(
    "HashChan3",
    [],
    {
      client: {
        wallet: deployer,
        public: publicClient
      }
    }
  )

  //console.log(hashChan3.address);

  const modServiceFactory = await viem.deployContract(
    "ModerationServiceFactory",
    [hashChan3.address],
    {
      client: {
        wallet: deployer,
        public: publicClient
      }
    }
  );

  //console.log(modServiceFactory.address);

  const instance = await viem.getContractAt(
    "ModerationServiceFactory",
    modServiceFactory.address,
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

  const [modServiceEvent] = await instance.getEvents.NewModerationService()
  
  const modService = await viem.getContractAt(
    "ModerationService",
    modServiceEvent.args.moderationService,
    {
      client: {
        wallet: modServiceOwner,
        public: publicClient
     }
    }
  );

  const addJanitorHash = await modService.write.addJanitor([
    deployer.account.address
  ])
  console.log('janitor', deployer.account.address);
  const tx2 = await publicClient.waitForTransactionReceipt({ hash: addJanitorHash });

  return {
    hashChan3,
    modServiceFactory,
    modService
  }



}
