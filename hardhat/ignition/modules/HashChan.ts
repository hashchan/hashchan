import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { parseEther } from "viem";

const HashChanModule = buildModule("HashChanModule", (m) => {

  const hashChan = m.contract("HashChan", [], {});

  return { hashChan };
});

export default HashChanModule;
