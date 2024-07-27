pragma solidity 0.8.26;

contract HashChan {
  event Thread (
    address indexed creator,
    bytes32 id,
    string imgUrl,
    string title,
    string subject,
    string content
  );
  event Comment (
    address indexed creator,
    bytes32 indexed threadId,
    bytes32 id,
    bytes32 replyId,
    string imgUrl,
    string content
  );

  function createThread(
    string memory url,
    string memory title,
    string memory content,
    string memory subject
  ) public {
    bytes32 threadId = keccak256(
      abi.encode(
        msg.sender,
        blockhash(block.number - 1)
    ));

    emit Thread (
      msg.sender,
      threadId,
      url,
      title,
      subject,
      content
    );
  }

  function createComment(
    bytes32  threadId,
    bytes32 replyId,
    string  memory imgUrl,
    string  memory content
  ) public {
    bytes32 id = keccak256(abi.encode(msg.sender, block.coinbase));
    emit Comment (
      msg.sender,
      threadId,
      id,
      replyId,
      imgUrl,
      content
    );
  }
}


