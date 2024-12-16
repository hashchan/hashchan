pragma solidity 0.8.28;

import "./HashChan3.sol";

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

contract ModerationService is Ownable, EIP712 {
  using ECDSA for bytes32;
  HashChan3 public hashChan3;

  string public name;
  string public uri;
  uint256 public port;

  uint256 public totalPositiveReviews;
  uint256 public totalNegativeReviews;

  event URLUpdated(string uri, uint256 port);

  struct FlagData {
    uint256 chainId;
    uint256 boardId;
    bytes32 threadId;
    bytes32 postId;
    uint256 reason;
  }

  bytes32 public constant FlagDataTypeHash = keccak256(
    "FlagData(uint256 chainId,uint256 boardId,bytes32 threadId,bytes32 postId,uint256 reason)"
  );

  struct Janitor {
    uint256 positiveReviews;
    uint256 negativeReviews;
    uint256 started;
    uint256 claimedWages;
  }

  mapping(address => Janitor) public janitors;
  event NewJanitor(address indexed janitor);
  event RemovedJanitor(address indexed janitor);

  struct Review {
    bool positive;
    string review;
    uint256 timestamp;
    bytes32 postId;
  }

  event ReviewAdded(
    address indexed janitor,
    bytes32 indexed postId,
    bool indexed positive,
    uint256 tip,
    string review
  );

  constructor(
    address _hashChan3,
    string memory _name,
    address _owner,
    string memory _uri,
    uint256 _port
  ) Ownable(
    _owner
  ) EIP712(
    _name,
    '1'
  ) {
    hashChan3 = HashChan3(_hashChan3);
    name = _name;
    uri = _uri;
    port = _port;
  }
  
  function setURL(
    string memory _uri,
    uint256 _port
  ) public onlyOwner {
    uri = _uri;
    port = _port;

    emit URLUpdated(_uri, _port);
  }

  function getServiceData() public view returns (
    string memory, string memory, uint256, uint256, uint256) {
    return (name, uri, port, totalPositiveReviews, totalNegativeReviews);
  }


  function getJanitor(address _janitor) public view returns (Janitor memory) {
    return janitors[_janitor];
  }

  function addJanitor(address _janitor) public onlyOwner {
    janitors[_janitor] = Janitor({positiveReviews: 0, negativeReviews: 0, started: block.number, claimedWages: 0});

    emit NewJanitor(_janitor);
  }

  function removeJanitor(address _janitor) public onlyOwner {
    require(janitors[_janitor].negativeReviews >=  10, "Janitors with insuficient negative feedback will not be removed");
    delete janitors[_janitor];
    emit RemovedJanitor(_janitor);
  }

  function addReview(
    address _janitor,
    bool isPositive,
    string memory review,
    bytes calldata flagSig,
    FlagData calldata flagData
  ) public payable {
    Janitor	 storage janitor = janitors[_janitor];
    require(janitor.started != 0, "Janitor hasn't started yet");
    bytes32 digest = _hashTypedDataV4(
      keccak256(
        abi.encode(
          FlagDataTypeHash,
          flagData.chainId,
          flagData.boardId,
          flagData.threadId,
          flagData.postId,
          flagData.reason
        )
      )
    );

    address signer = digest.recover(flagSig);
    require(signer == _janitor, "signer janitor mis match");

    if (isPositive) {
      janitor.positiveReviews++;
      totalPositiveReviews++;
    } else {
      janitor.negativeReviews++;
      totalNegativeReviews++;
    }

    janitor.claimedWages += msg.value;
    (bool success,) = _janitor.call{value: msg.value}("");
    require(success, "Failed to send ETH");

    emit ReviewAdded(
      _janitor,
      flagData.postId,
      isPositive,
      msg.value,
      review
    );
  }
}
