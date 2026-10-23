// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IIssuerRegistry {
    function isIssuerAccredited(string calldata did) external view returns (bool);
}

/**
 * @title IssuanceLog
 * @dev Append-only public issuance transparency log for ShroudIT.
 * Holds commitments to credential issuance batches to detect rogue / unauthorized mass issuance.
 */
contract IssuanceLog {
    struct Batch {
        string batchId;
        string issuerDid;
        bytes32 batchMerkleRoot;
        uint32 count;
        uint256 timestamp;
        address committedBy;
    }

    IIssuerRegistry public issuerRegistry;
    address public owner;

    Batch[] private _batches;

    // Mapping from issuer DID to array of batch indices
    mapping(string => uint256[]) private _issuerBatches;

    event BatchLogged(
        uint256 indexed batchIndex,
        string batchId,
        string indexed issuerDid,
        bytes32 indexed batchMerkleRoot,
        uint32 count,
        uint256 timestamp
    );

    event IssuerRegistryUpdated(address indexed newRegistry);

    modifier onlyOwner() {
        require(msg.sender == owner, "IssuanceLog: caller is not the owner");
        _;
    }

    constructor(address _issuerRegistry) {
        owner = msg.sender;
        issuerRegistry = IIssuerRegistry(_issuerRegistry);
    }

    function setIssuerRegistry(address _newRegistry) external onlyOwner {
        require(_newRegistry != address(0), "IssuanceLog: invalid address");
        issuerRegistry = IIssuerRegistry(_newRegistry);
        emit IssuerRegistryUpdated(_newRegistry);
    }

    /**
     * @notice Log a newly issued batch of credentials.
     * @param batchId Unique identifier for this issuance batch
     * @param issuerDid DID of accredited issuer
     * @param batchMerkleRoot Cryptographic commitment of all credentials in this batch
     * @param count Number of credentials in batch
     */
    function logBatch(
        string calldata batchId,
        string calldata issuerDid,
        bytes32 batchMerkleRoot,
        uint32 count
    ) external returns (uint256 batchIndex) {
        if (address(issuerRegistry) != address(0)) {
            require(
                issuerRegistry.isIssuerAccredited(issuerDid),
                "IssuanceLog: issuer is not accredited"
            );
        }
        require(bytes(batchId).length > 0, "IssuanceLog: invalid batchId");
        require(batchMerkleRoot != bytes32(0), "IssuanceLog: invalid root");
        require(count > 0, "IssuanceLog: count must be > 0");

        batchIndex = _batches.length;

        _batches.push(Batch({
            batchId: batchId,
            issuerDid: issuerDid,
            batchMerkleRoot: batchMerkleRoot,
            count: count,
            timestamp: block.timestamp,
            committedBy: msg.sender
        }));

        _issuerBatches[issuerDid].push(batchIndex);

        emit BatchLogged(
            batchIndex,
            batchId,
            issuerDid,
            batchMerkleRoot,
            count,
            block.timestamp
        );
    }

    function totalBatches() external view returns (uint256) {
        return _batches.length;
    }

    function getBatch(uint256 index)
        external
        view
        returns (
            string memory batchId,
            string memory issuerDid,
            bytes32 batchMerkleRoot,
            uint32 count,
            uint256 timestamp,
            address committedBy
        )
    {
        require(index < _batches.length, "IssuanceLog: index out of bounds");
        Batch storage b = _batches[index];
        return (
            b.batchId,
            b.issuerDid,
            b.batchMerkleRoot,
            b.count,
            b.timestamp,
            b.committedBy
        );
    }

    function getIssuerBatchIndices(string calldata issuerDid)
        external
        view
        returns (uint256[] memory)
    {
        return _issuerBatches[issuerDid];
    }
}
