pragma solidity 0.8.26;

contract HashChan2 {
  /*
  enum Board {
    pol,
    biz,
    g,
    sci,
    x
  }
   */

  uint256 public boardCount;
  mapping(uint256 => string) boards;

  event Board (
    uint256 indexed id,
    string name
  );


  event Thread (
    uint256 indexed board,
    address indexed creator,
    bytes32 indexed id,
    string imgUrl,
    string title,
    string content,
    uint256 timestamp
  );

  event Comment (
    address indexed creator,
    bytes32 indexed threadId,
    bytes32 indexed id,
    string imgUrl,
    string content,
    uint256 timestamp
  );
  constructor() {
    boardCount = 4;
    boards[0] = "pol";
    emit Board(0, "pol");
    boards[1] = "biz";
    emit Board(1, "biz");
    boards[2] = "g";
    emit Board(2, "g");
    boards[3] = "sci";
    emit Board(3, "sci");
    boards[4] = "x";
    emit Board(4, "x");
  }

  function addBoard(string memory name) public returns (uint256) {
    boardCount++;
    boards[boardCount] = name;
    emit Board(boardCount, name);
    return boardCount;
  }

  function createThread(
    uint256 board,
    string memory title,
    string memory url,
    string memory content
  ) public {
    bytes32 threadId = keccak256(
      abi.encode(
        board,
        title,
        msg.sender,
        block.timestamp
      ));

    emit Thread (
      board,
      msg.sender,
      threadId,
      url,
      title,
      content,
      block.timestamp
    );
  }

  function createComment(
    bytes32  threadId,
    string  memory imgUrl,
    string  memory content
  ) public {
    bytes32 id = keccak256(abi.encode(msg.sender, block.timestamp, threadId));
    emit Comment (
      msg.sender,
      threadId,
      id,
      imgUrl,
      content,
      block.timestamp
    );
  }
}


