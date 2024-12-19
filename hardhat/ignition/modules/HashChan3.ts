import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { parseEther } from "viem";

const HashChan3Module = buildModule("HashChan3Module", (m) => {

  const hashChan3 = m.contract("HashChan3", [], {});

  const deploy = m.call(hashChan3, "deploy")

  const address = m.readEventArguement()

  const modServiceFactory = m.contract("ModerationServiceFactory", [hashChan3.address], {});

  return {  modServiceFactory };
});

export default HashChan3Module;
