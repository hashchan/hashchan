import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { parseEther } from "viem";

const HashChan2Module = buildModule("HashChan2Module", (m) => {

  const hashChan = m.contract("HashChan2", [], {});

  return { hashChan };
});

export default HashChan2Module;
