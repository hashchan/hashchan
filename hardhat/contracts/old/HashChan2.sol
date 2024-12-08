
pragma solidity 0.8.26;

contract HashChan2 {
  
  uint256 public boardCount;
  mapping(uint256 => Board) public boards;

  struct Board {
    string  name;
    string  symbol;
  }

  event NewBoard (
    uint256 indexed id,
    string indexed nameHash,
    string indexed symbolHash,
    string name,
    string symbol
  );

  event NewThread (
    uint256 indexed board,
    address indexed creator,
    bytes32 indexed id,
    string imgUrl,
    string title,
    string content,
    uint256 timestamp
  );

  event NewPost (
    uint256 indexed board,
    bytes32 indexed threadId,
    bytes32 indexed id,
    address creator,
    bytes32[] replyIds,
    string imgUrl,
    string content,
    uint256 timestamp
  );

  constructor() {
    createBoard('Politically Incorrect', 'pol');
    createBoard('Business & Finance', 'biz');
    createBoard('Technology', 'g');
    createBoard('Science & Math', 'sci');
    createBoard('Fringe', 'x');
    createBoard('Maid', 'maid');
  }

  function createBoard(
    string memory name,
    string memory symbol
  ) public returns (uint256) {
    boards[boardCount] = Board(name, symbol);
    boardCount++;
    emit NewBoard(boardCount - 1, name, symbol, name, symbol);
    return boardCount;
  }

  function createThread(
    uint256 board,
    string memory title,
    string memory url,
    string memory content
  ) public returns (bytes32 threadId) {
    threadId = keccak256(
      abi.encode(
        board,
        title,
        msg.sender,
        block.timestamp
      ));

    emit NewThread (
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
    uint256 board,
    bytes32  threadId,
    bytes32[] memory replyIds,
    string  memory imgUrl,
    string  memory content
  ) public returns (bytes32 id){
    id = keccak256(abi.encode(
      msg.sender,
      block.timestamp,
      threadId
    ));
    emit NewPost(
      board,
      threadId,
      id,
      msg.sender,
      replyIds,
      imgUrl,
      content,
      block.timestamp
    );
  }
  
}

