pragma solidity 0.8.28;
import "./ModerationService.sol";
import "./HashChan3.sol";

contract ModerationServiceFactory {
  HashChan3 public hashChan3;

  address[] public modServices;
  uint256 public modServiceIterator;

  event ModerationServiceCreated(
    address indexed owner,
    address moderationService,
    uint256 timestamp
  );

  constructor () {
  }


  function createModerationService(
    string memory name
  ) public  {
    ModerationService  newModService = new ModerationService(
      address(hashChan3),
      name
    );
    modServices.push(address(newModService));
    modServiceIterator++;
    emit ModerationServiceCreated(msg.sender, address(newModService), block.timestamp);
  }
}
