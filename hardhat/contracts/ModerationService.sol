pragma solidity 0.8.28;

import "./HashChan3.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
contract ModerationService is Ownable {
  HashChan3 public hashChan3;

  string public name;


  struct Janitor {
    uint256 positiveReviews;
    uint256 negativeReviews;
    uint256 started;
    uint256 claimedWages;
  }

  mapping(address => Janitor) public janitors;
  event JanitorAdded(address indexed janitor);
  event JanitorRemoved(address indexed janitor);

  struct Review {
    bool positive;
    string review;
    uint256 timestamp;
    bytes32 postId;
  }

  event ReviewAdded(address indexed janitor, bool indexed positive, string review, bytes32 postId, uint256 tip);

  constructor(address _hashChan3, string memory _name) Ownable(msg.sender) {
    hashChan3 = HashChan3(_hashChan3);
    name = _name;
  }

  function addJanitor(address _janitor) public onlyOwner {
    janitors[_janitor] = Janitor({positiveReviews: 0, negativeReviews: 0, started: block.timestamp, claimedWages: 0});

    emit JanitorAdded(_janitor);
  }

  function removeJanitor(address _janitor) public onlyOwner {
    require(janitors[_janitor].negativeReviews >=  10, "Janitors with insuficient negative feedback will not be removed");
    delete janitors[_janitor];
    emit JanitorRemoved(_janitor);
  }

  function addReview(
    address _janitor,
    bool positive,
    string memory review,
    bytes32 postId
  ) public payable {
    Janitor	 storage janitor = janitors[_janitor];
    require(janitor.started != 0, "Janitor hasn't started yet");
    if (positive) {
      janitor.positiveReviews++;
    } else {
      janitor.negativeReviews++;
    }

    janitor.claimedWages += msg.value;

    emit ReviewAdded(_janitor, positive, review, postId, msg.value);



  }

}
