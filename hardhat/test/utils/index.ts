// test/utils/index.ts
import { EthereumProvider } from "hardhat/types/providers";
import { network } from "hardhat";
import { loadAndExecuteDeploymentsFromFiles } from "../../rocketh/environment.js";
import * as artifacts from "../../generated/artifacts/index.js";

type Viem = Awaited<ReturnType<typeof network.connect>>["viem"];

export function setupHashChan3Fixtures(provider: EthereumProvider, viem: Viem) {
  return {
    async deployAll() {
      const env = await loadAndExecuteDeploymentsFromFiles({ provider });

      const HashChan3 = env.get<typeof artifacts.HashChan3.abi>("HashChan3");
      const ModerationServiceFactory = env.get<
        typeof artifacts.ModerationServiceFactory.abi
      >("ModerationServiceFactory");

      const { deployer, admin } = env.namedAccounts;

      // admin plays the role of the moderation service owner: it creates
      // the service through the factory, and the resulting ModerationService
      // instance is bound to admin's wallet client throughout.
      const factoryAsAdmin = env.viem.getWritableContract(
        ModerationServiceFactory,
        { account: admin },
      );

      const createHash = await factoryAsAdmin.write.createModerationService([
        "Basic Service",
        "orbit.hashchan.org",
        443n,
      ]);
      await env.viem.publicClient.waitForTransactionReceipt({
        hash: createHash,
      });

      const [newServiceEvent] =
        await factoryAsAdmin.getEvents.NewModerationService();
      const modServiceAddress = newServiceEvent.args
        .moderationService as `0x${string}`;

      // ModerationService instances are spawned at runtime by the factory's
      // `new ModerationService(...)` call, so rocketh never tracks them as a
      // deployment - fetch it directly through hardhat-viem instead.
      const modService = await viem.getContractAt(
        "ModerationService",
        modServiceAddress,
        { client: { wallet: await viem.getWalletClient(admin) } },
      );

      const addJanitorHash = await modService.write.addJanitor([deployer]);
      await env.viem.publicClient.waitForTransactionReceipt({
        hash: addJanitorHash,
      });

      return {
        env,
        HashChan3,
        ModerationServiceFactory,
        modService,
        namedAccounts: env.namedAccounts,
      };
    },
  };
}
