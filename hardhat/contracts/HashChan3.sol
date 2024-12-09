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

  event NewBoard (
    uint256 indexed boardId,
    string name,
    string symbol,
    string description,
    string bannerUrl,
    string bannerCID,
    string[] rules
  );

  event NewThread (
    uint256 indexed boardId,
    bytes32 indexed threadId,
    address indexed creator,
    string imgUrl,
    string imgCID,
    string title,
    string content
  );

  event NewPost (
    uint256 boardId,
    bytes32 indexed threadId,
    bytes32 indexed postId,
    bytes32[] replyIds,
    address indexed creator,
    string imgUrl,
    string imgCID,
    string content
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
      rules
    );
    return boardCount;
  }

  function getBoard(uint256 id) public view returns (Board memory) {
    return boards[id];
  }

  function createThread(
    uint256 boardId,
    string memory title,
    string memory imgUrl,
    string memory imgCID,
    string memory content
  ) public returns (bytes32 threadId) {
    threadId = keccak256(
      abi.encode(
        boardId,
        imgCID,
        msg.sender,
        block.number
    ));

    emit NewThread (
      boardId,
      threadId,
      msg.sender,
      imgUrl,
      imgCID,
      title,
      content
    );
  }

  function createPost(
    uint256 boardId,
    bytes32  threadId,
    bytes32[] memory replyIds,
    string  memory imgUrl,
    string  memory imgCID,
    string  memory content
  ) public returns (bytes32 postId){
    postId = keccak256(abi.encode(
      boardId,
      threadId,
      imgCID,
      msg.sender,
      block.number
    ));
    emit NewPost(
      boardId,
      threadId,
      postId,
      replyIds,
      msg.sender,
      imgUrl,
      imgCID,
      content
    );
  }

}

