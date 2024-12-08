pragma solidity 0.8.28;

contract HashChan3 {

  uint256 public boardCount;
  mapping(uint256 => Board) public boards;

  struct Board {
    string  name;
    string  symbol;
    string  description;
    string  bannerUrl;
    string bannerCID;
    string[] rules;
  }

  struct Image {
    string url;
    string CID;
  }

  event NewBoard (
    uint256 indexed id,
    string name,
    string symbol,
    string description,
    string bannerUrl,
    string bannerCID,
    string[] rules,
    uint256 blockNumber
  );

  event NewThread (
    uint256 indexed board,
    address indexed creator,
    bytes32 indexed id,
    string imgUrl,
    string imgCID,
    string title,
    string content,
    uint256 blockNumber
  );

  event NewPost (
    uint256 indexed board,
    bytes32 indexed threadId,
    bytes32 indexed id,
    address creator,
    bytes32[] replyIds,
    string imgUrl,
    string imgCID,
    string content,
    uint256 blockNumber
  );

  constructor() {
    string[] memory rules = new string[](3);

    rules[0] ="Debate and discussion related to politics and current events is welcome.";
    rules[1] = "You are free to speak your mind, but do not attack other users. You may challenge one another, but keep it civil!";
    rules[2] = "Posting pornography is not permitted. This is a politics board, not a porn board.";

    createBoard(
      "Politically Incorrect",
      "pol",
      "This board is for the discussion of news, world events, political issues, and other related topics.",
      "https://i.4cdn.org/pol/1493993226750.jpg",
      "bafkreib7cvtqy5exmymnm32hksayaok7ywf5lsoz3xglipfnverpdgmrki",
      rules
    );
  }

  function createBoard(
    string memory name,
    string memory symbol,
    string memory description,
    string memory bannerUrl,
    string memory bannerCID,
    string[] memory rules
  ) public returns (uint256) {
    require(bytes(symbol).length <= 4, "symbol too long");
    boards[boardCount] = Board(
      name,
      symbol,
      description,
      bannerUrl,
      bannerCID,
      rules
    );
    boardCount++;
    emit NewBoard(
      boardCount - 1,
      name,
      symbol,
      description,
      bannerUrl,
      bannerCID,
      rules,
      block.number

    );
    return boardCount;
  }

  function createThread(
    uint256 board,
    string memory title,
    string memory url,
    string memory imgCID,
    string memory content
  ) public returns (bytes32 threadId) {
    threadId = keccak256(
      abi.encode(
        board,
        title,
        msg.sender,
        imgCID,
        block.number
    ));

    emit NewThread (
      board,
      msg.sender,
      threadId,
      url,
      imgCID,
      title,
      content,
      block.number
    );
  }

  function createPost(
    uint256 board,
    bytes32  threadId,
    bytes32[] memory replyIds,
    string  memory imgUrl,
    string  memory imgCID,
    string  memory content
  ) public returns (bytes32 id){
    id = keccak256(abi.encode(
      threadId,
      imgCID,
      msg.sender,
      block.number
    ));
    emit NewPost(
      board,
      threadId,
      id,
      msg.sender,
      replyIds,
      imgUrl,
      imgCID,
      content,
      block.number
    );
  }

}

