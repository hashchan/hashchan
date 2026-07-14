import { deployScript, artifacts } from "../rocketh/deploy.js";

export default deployScript(
  async ({ deploy, namedAccounts }) => {
    const { deployer } = namedAccounts;

    const hashChan3 = await deploy("HashChan3", {
      account: deployer,
      artifact: artifacts.HashChan3,
    });

    await deploy("ModerationServiceFactory", {
      account: deployer,
      artifact: artifacts.ModerationServiceFactory,
      args: [hashChan3.address],
    });
  },
  { tags: ["HashChan3", "ModerationServiceFactory", "HashChan3_deploy"] },
);
