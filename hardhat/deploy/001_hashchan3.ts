
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

  console.log('hashchan 3 addr:', hashChan3.address);

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

  console.log('modServiceFactory addr: ',modServiceFactory.address);

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
  console.log('createServiceHash', createServiceHash);
  const tx = await publicClient.waitForTransactionReceipt({ hash: createServiceHash });
  console.log('tx', tx);

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

  console.log('addJanitorHash', addJanitorHash);
  const tx2 = await publicClient.waitForTransactionReceipt({ hash: addJanitorHash });
  console.log('tx2', tx2);

  return {
    hashChan3,
    modServiceFactory,
    modService
  }



}
