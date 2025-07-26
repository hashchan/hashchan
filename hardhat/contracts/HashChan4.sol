pragma solidity 0.8.28;

contract HashChan4 {

  uint256 public boardCount;
  mapping(uint256 => Board) public boards;
  mapping(uint256 => bytes4) public usedSymbols;

  struct Board {
    string  name;
    bytes4  symbol;
    string  description;
    string  bannerUrl;
    string bannerCID;
    string[] rules;
  }

  event NewBoard (
    uint256 indexed boardId,
    string name,
    bytes4 symbol,
    string description,
    string bannerUrl,
    string bannerCID,
    string[] rules,
    uint256 timestamp
  );

  event NewThread (
    uint256 indexed boardId,
    bytes32 indexed threadId,
    address indexed creator,
    string imgUrl,
    string imgCID,
    string title,
    string content,
    uint256 timestamp
  );

  event NewPost (
    uint256 boardId,
    bytes32 indexed threadId,
    bytes32 indexed postId,
    bytes32[] replyIds,
    address indexed creator,
    string imgUrl,
    string imgCID,
    string content,
    uint256 timestamp
  );

  constructor() {
    string[] memory rules = new string[](3);

    rules[0] ="Debate, Shilling, Astroturfing, Fudding and spamming anything about crypto, cryptocurrency, blockchain, NFTs, DeFi, etc is welcome.";
    rules[1] = "You are free to speak your mind, but do not attack other users. You may challenge one another, but keep it civil!";
    rules[2] = "Posting pornography is not permitted. This is a crypto board, not a porn board.";

    createBoard(
      "Crypto",
      "CRPT",
      "This board is discussion of cryptography, cryptocurrency, distributed technologies, DeFi, NFTs, etc.",
      "https://bafkreigns4a2t5bhfqcz5eebesznmo3myxtcgfk6kcjjngmhlkxdcqdixy.ipfs.w3s.link/",
      "bafkreigns4a2t5bhfqcz5eebesznmo3myxtcgfk6kcjjngmhlkxdcqdixy",
      rules
    );
  }

  function createBoard(
    string memory name,
    bytes4 symbol,
    string memory description,
    string memory bannerUrl,
    string memory bannerCID,
    string[] memory rules
  ) public returns (uint256) {
    require(symbol.length <= 4, "symbol too long");
    require(usedSymbols[boardCount] == 0, "symbol already used");

    boards[boardCount] = Board(
      name,
      symbol,
      description,
      bannerUrl,
      bannerCID,
      rules
    );
    usedSymbols[boardCount] = symbol;
    boardCount++;
    emit NewBoard(
      boardCount - 1,
      name,
      symbol,
      description,
      bannerUrl,
      bannerCID,
      rules,
      block.timestamp
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
      content,
      block.timestamp
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
      content,
      block.timestamp
    );
  }

}

