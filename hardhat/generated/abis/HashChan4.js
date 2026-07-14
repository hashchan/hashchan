export const Abi_HashChan4 = /** @type {const} **/ ([
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "boardId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "bytes4",
        "name": "symbol",
        "type": "bytes4"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "description",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "bannerUrl",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "bannerCID",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string[]",
        "name": "rules",
        "type": "string[]"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "NewBoard",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "boardId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "threadId",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "postId",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "bytes32[]",
        "name": "replyIds",
        "type": "bytes32[]"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "creator",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "imgUrl",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "imgCID",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "content",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "NewPost",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "boardId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "threadId",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "creator",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "imgUrl",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "imgCID",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "title",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "content",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "NewThread",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "boardCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "boards",
    "outputs": [
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "bytes4",
        "name": "symbol",
        "type": "bytes4"
      },
      {
        "internalType": "string",
        "name": "description",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "bannerUrl",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "bannerCID",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "bytes4",
        "name": "symbol",
        "type": "bytes4"
      },
      {
        "internalType": "string",
        "name": "description",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "bannerUrl",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "bannerCID",
        "type": "string"
      },
      {
        "internalType": "string[]",
        "name": "rules",
        "type": "string[]"
      }
    ],
    "name": "createBoard",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "boardId",
        "type": "uint256"
      },
      {
        "internalType": "bytes32",
        "name": "threadId",
        "type": "bytes32"
      },
      {
        "internalType": "bytes32[]",
        "name": "replyIds",
        "type": "bytes32[]"
      },
      {
        "internalType": "string",
        "name": "imgUrl",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "imgCID",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "content",
        "type": "string"
      }
    ],
    "name": "createPost",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "postId",
        "type": "bytes32"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "boardId",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "title",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "imgUrl",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "imgCID",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "content",
        "type": "string"
      }
    ],
    "name": "createThread",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "threadId",
        "type": "bytes32"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      }
    ],
    "name": "getBoard",
    "outputs": [
      {
        "components": [
          {
            "internalType": "string",
            "name": "name",
            "type": "string"
          },
          {
            "internalType": "bytes4",
            "name": "symbol",
            "type": "bytes4"
          },
          {
            "internalType": "string",
            "name": "description",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "bannerUrl",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "bannerCID",
            "type": "string"
          },
          {
            "internalType": "string[]",
            "name": "rules",
            "type": "string[]"
          }
        ],
        "internalType": "struct HashChan4.Board",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "usedSymbols",
    "outputs": [
      {
        "internalType": "bytes4",
        "name": "",
        "type": "bytes4"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
]);