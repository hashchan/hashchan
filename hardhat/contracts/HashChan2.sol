pragma solidity 0.8.26;

contract HashChan2 {
  
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

  event Post (
    address indexed creator,
    bytes32 indexed threadId,
    bytes32 indexed id,
    bytes32[] replyIds,
    string imgUrl,
    string content,
    uint256 timestamp
  );
  constructor() {
    createBoard('pol');
    createBoard('biz');
    createBoard('g');
    createBoard('sci');
    createBoard('x');
  }

  function createBoard(string memory name) public returns (uint256) {
    boards[boardCount] = name;
    boardCount++;
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

  function createPost(
    bytes32  threadId,
    bytes32[] memory replyIds,
    string  memory imgUrl,
    string  memory content
  ) public {
    bytes32 id = keccak256(abi.encode(
      msg.sender,
      block.timestamp,
      threadId
    ));
    emit Post(
      msg.sender,
      threadId,
      id,
      replyIds,
      imgUrl,
      content,
      block.timestamp
    );
  }
}


