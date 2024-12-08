pragma solidity 0.8.28;
import "./ModerationService.sol";
import "./HashChan3.sol";

contract ModerationServiceFactory {
  HashChan3 public hashChan3;

  address[] public modServices;
  uint256 public modServiceIterator;

  event NewModerationService(
    address indexed owner,
    address indexed moderationService,
    uint256 indexed blockNumber,
    string name
  );

  constructor () {
  }

  function createModerationService(
    string memory name
  ) public  {
    ModerationService  newModService = new ModerationService(
      address(hashChan3),
      name,
      msg.sender
    );
    modServices.push(address(newModService));
    modServiceIterator++;
    emit NewModerationService(
      msg.sender,
      address(newModService),
      block.number,
      name
    );
  }
}
