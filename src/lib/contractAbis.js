// Auto-generated clean contract ABIs for ShroudIT Web3 client
export const CONTRACT_ABIS = {
  "IssuerRegistry": [
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
          "internalType": "string",
          "name": "didIndex",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "did",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "bytes",
          "name": "newPublicKey",
          "type": "bytes"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        }
      ],
      "name": "IssuerKeyUpdated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "string",
          "name": "didIndex",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "did",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "name",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "bytes",
          "name": "publicKey",
          "type": "bytes"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        }
      ],
      "name": "IssuerRegistered",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "string",
          "name": "didIndex",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "did",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "reason",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        }
      ],
      "name": "IssuerRevoked",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "string",
          "name": "didIndex",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "did",
          "type": "string"
        },
        {
          "indexed": true,
          "internalType": "bytes32",
          "name": "schemaHash",
          "type": "bytes32"
        }
      ],
      "name": "SchemaAuthorized",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "did",
          "type": "string"
        }
      ],
      "name": "getIssuer",
      "outputs": [
        {
          "internalType": "string",
          "name": "name",
          "type": "string"
        },
        {
          "internalType": "bytes",
          "name": "publicKey",
          "type": "bytes"
        },
        {
          "internalType": "bool",
          "name": "isActive",
          "type": "bool"
        },
        {
          "internalType": "uint256",
          "name": "registeredAt",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "revokedAt",
          "type": "uint256"
        },
        {
          "internalType": "bytes32[]",
          "name": "supportedSchemas",
          "type": "bytes32[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "index",
          "type": "uint256"
        }
      ],
      "name": "getIssuerDidByIndex",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
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
          "name": "did",
          "type": "string"
        }
      ],
      "name": "isIssuerAccredited",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "owner",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "did",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "name",
          "type": "string"
        },
        {
          "internalType": "bytes",
          "name": "publicKey",
          "type": "bytes"
        },
        {
          "internalType": "bytes32[]",
          "name": "initialSchemas",
          "type": "bytes32[]"
        }
      ],
      "name": "registerIssuer",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "did",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "reason",
          "type": "string"
        }
      ],
      "name": "revokeIssuer",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "did",
          "type": "string"
        },
        {
          "internalType": "bytes32",
          "name": "schemaHash",
          "type": "bytes32"
        }
      ],
      "name": "supportsSchema",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "totalIssuers",
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
          "internalType": "string",
          "name": "did",
          "type": "string"
        },
        {
          "internalType": "bytes",
          "name": "newPublicKey",
          "type": "bytes"
        }
      ],
      "name": "updateIssuerKey",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ],
  "StatusRegistry": [
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
          "name": "epochId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "bytes32",
          "name": "statusMerkleRoot",
          "type": "bytes32"
        },
        {
          "indexed": false,
          "internalType": "uint32",
          "name": "activeCount",
          "type": "uint32"
        },
        {
          "indexed": false,
          "internalType": "uint32",
          "name": "revokedCount",
          "type": "uint32"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "anchoredBy",
          "type": "address"
        }
      ],
      "name": "EpochStatusRootAnchored",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "oracle",
          "type": "address"
        }
      ],
      "name": "OracleAuthorized",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "oracle",
          "type": "address"
        }
      ],
      "name": "OracleRevoked",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "epochId",
          "type": "uint256"
        },
        {
          "internalType": "bytes32",
          "name": "statusMerkleRoot",
          "type": "bytes32"
        },
        {
          "internalType": "uint32",
          "name": "activeCount",
          "type": "uint32"
        },
        {
          "internalType": "uint32",
          "name": "revokedCount",
          "type": "uint32"
        }
      ],
      "name": "anchorEpochStatusRoot",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "epochId",
          "type": "uint256"
        }
      ],
      "name": "getEpochStatus",
      "outputs": [
        {
          "internalType": "bytes32",
          "name": "statusMerkleRoot",
          "type": "bytes32"
        },
        {
          "internalType": "uint32",
          "name": "activeCount",
          "type": "uint32"
        },
        {
          "internalType": "uint32",
          "name": "revokedCount",
          "type": "uint32"
        },
        {
          "internalType": "uint256",
          "name": "anchoredAt",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "anchoredBy",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "isAuthorizedOracle",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "latestEpoch",
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
      "inputs": [],
      "name": "owner",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "oracle",
          "type": "address"
        },
        {
          "internalType": "bool",
          "name": "authorized",
          "type": "bool"
        }
      ],
      "name": "setOracle",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "epochId",
          "type": "uint256"
        },
        {
          "internalType": "bytes32",
          "name": "candidateRoot",
          "type": "bytes32"
        }
      ],
      "name": "verifyEpochRoot",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ],
  "IssuanceLog": [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_issuerRegistry",
          "type": "address"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "batchIndex",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "batchId",
          "type": "string"
        },
        {
          "indexed": true,
          "internalType": "string",
          "name": "issuerDid",
          "type": "string"
        },
        {
          "indexed": true,
          "internalType": "bytes32",
          "name": "batchMerkleRoot",
          "type": "bytes32"
        },
        {
          "indexed": false,
          "internalType": "uint32",
          "name": "count",
          "type": "uint32"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        }
      ],
      "name": "BatchLogged",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "newRegistry",
          "type": "address"
        }
      ],
      "name": "IssuerRegistryUpdated",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "index",
          "type": "uint256"
        }
      ],
      "name": "getBatch",
      "outputs": [
        {
          "internalType": "string",
          "name": "batchId",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "issuerDid",
          "type": "string"
        },
        {
          "internalType": "bytes32",
          "name": "batchMerkleRoot",
          "type": "bytes32"
        },
        {
          "internalType": "uint32",
          "name": "count",
          "type": "uint32"
        },
        {
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "committedBy",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "issuerDid",
          "type": "string"
        }
      ],
      "name": "getIssuerBatchIndices",
      "outputs": [
        {
          "internalType": "uint256[]",
          "name": "",
          "type": "uint256[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "issuerRegistry",
      "outputs": [
        {
          "internalType": "contract IIssuerRegistry",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "batchId",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "issuerDid",
          "type": "string"
        },
        {
          "internalType": "bytes32",
          "name": "batchMerkleRoot",
          "type": "bytes32"
        },
        {
          "internalType": "uint32",
          "name": "count",
          "type": "uint32"
        }
      ],
      "name": "logBatch",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "batchIndex",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "owner",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_newRegistry",
          "type": "address"
        }
      ],
      "name": "setIssuerRegistry",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "totalBatches",
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
  ],
  "DocumentVerifier": [
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "leaf",
          "type": "bytes32"
        },
        {
          "internalType": "bytes32",
          "name": "root",
          "type": "bytes32"
        },
        {
          "internalType": "bytes32[]",
          "name": "siblings",
          "type": "bytes32[]"
        },
        {
          "internalType": "bool[]",
          "name": "isRight",
          "type": "bool[]"
        }
      ],
      "name": "verifyInclusionProof",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "pure",
      "type": "function"
    }
  ]
};
