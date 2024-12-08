import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { parseEther } from "viem";

const HashChan3Module = buildModule("HashChan3Module", (m) => {

  const hashChan3 = m.contract("HashChan3", [], {});
  const modServiceFactory = m.contract("ModerationServiceFactory", [], {});

  return { hashChan3, modServiceFactory };
});

export default HashChan3Module;
