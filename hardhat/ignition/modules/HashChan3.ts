import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { parseEther } from "viem";

const HashChan3Module = buildModule("HashChan3Module", (m) => {

  //const hashChan3 = m.contract("HashChan3", [], {});
  const modServiceFactory = m.contract("ModerationServiceFactory", ['0xF65f70dC7Ba661D090B7eF3fF2e7b7DBCA1a396B'], {});

  return {  modServiceFactory };
});

export default HashChan3Module;
