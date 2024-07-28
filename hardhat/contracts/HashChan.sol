pragma solidity 0.8.26;

contract HashChan {
  enum Board {
    pol,
    biz,
    g,
    sci,
    x
  }

  event Thread (
    Board indexed board,
    address indexed creator,
    bytes32 indexed id,
    string imgUrl,
    string title,
    string content
  );
  event Comment (
    address indexed creator,
    bytes32 indexed threadId,
    bytes32 indexed id,
    string imgUrl,
    string content
  );

  function createThread(
    Board board,
    string memory title,
    string memory url,
    string memory content
  ) public {
    bytes32 threadId = keccak256(
      abi.encode(
        board,
        title,
        msg.sender,
        block.coinbase
      ));

    emit Thread (
      board,
      msg.sender,
      threadId,
      url,
      title,
      content
    );
  }

  function createComment(
    bytes32  threadId,
    string  memory imgUrl,
    string  memory content
  ) public {
    bytes32 id = keccak256(abi.encode(msg.sender, block.coinbase));
    emit Comment (
      msg.sender,
      threadId,
      id,
      imgUrl,
      content
    );
  }
}


