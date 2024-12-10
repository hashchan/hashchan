import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { parseEther } from "viem";

const HashChan3Module = buildModule("HashChan3Module", (m) => {

  //const hashChan3 = m.contract("HashChan3", [], {});
  const modServiceFactory = m.contract("ModerationServiceFactory", ['0x5ddF069Ee98e05571c1C9E90edcd08B5a388A7a1'], {});

  return {  modServiceFactory };
});

export default HashChan3Module;
