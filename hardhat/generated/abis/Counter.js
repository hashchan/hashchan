export const Abi_Counter = /** @type {const} **/ ([
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "by",
        "type": "uint256"
      }
    ],
    "name": "Increment",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "inc",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "by",
        "type": "uint256"
      }
    ],
    "name": "incBy",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "x",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
]);