// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title StatusRegistry
 * @dev Anchors epoch revocation Merkle roots for ShroudIT.
 * Verifiers download the full revocation bitvector once per epoch, verifying
 * non-revocation locally without leaking which credential is being inspected.
 */
contract StatusRegistry {
    struct EpochStatus {
        bytes32 statusMerkleRoot;
        uint32 activeCount;
        uint32 revokedCount;
        uint256 anchoredAt;
        address anchoredBy;
    }

    address public owner;
    
    // Mapping from epoch ID to EpochStatus struct
    mapping(uint256 => EpochStatus) private _epochRoots;
    
    // Latest anchored epoch
    uint256 public latestEpoch;

    // Authorized oracles permitted to anchor status roots
    mapping(address => bool) public isAuthorizedOracle;

    event EpochStatusRootAnchored(
        uint256 indexed epochId,
        bytes32 indexed statusMerkleRoot,
        uint32 activeCount,
        uint32 revokedCount,
        uint256 timestamp,
        address indexed anchoredBy
    );

    event OracleAuthorized(address indexed oracle);
    event OracleRevoked(address indexed oracle);

    modifier onlyOracleOrOwner() {
        require(
            msg.sender == owner || isAuthorizedOracle[msg.sender],
            "StatusRegistry: caller not authorized to anchor roots"
        );
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "StatusRegistry: caller is not the owner");
        _;
    }

    constructor() {
        owner = msg.sender;
        isAuthorizedOracle[msg.sender] = true;
    }

    function setOracle(address oracle, bool authorized) external onlyOwner {
        require(oracle != address(0), "StatusRegistry: invalid oracle address");
        isAuthorizedOracle[oracle] = authorized;
        if (authorized) {
            emit OracleAuthorized(oracle);
        } else {
            emit OracleRevoked(oracle);
        }
    }

    /**
     * @notice Anchor a fresh epoch Merkle revocation root.
     * @param epochId Sequential epoch counter (e.g. 142)
     * @param statusMerkleRoot SHA-256 / Poseidon root over the revocation bitvector
     * @param activeCount Count of active unrevoked credentials in this epoch
     * @param revokedCount Count of revoked credentials in this epoch
     */
    function anchorEpochStatusRoot(
        uint256 epochId,
        bytes32 statusMerkleRoot,
        uint32 activeCount,
        uint32 revokedCount
    ) external onlyOracleOrOwner {
        require(epochId >= latestEpoch, "StatusRegistry: epoch must be monotonically increasing");
        require(statusMerkleRoot != bytes32(0), "StatusRegistry: invalid root hash");

        _epochRoots[epochId] = EpochStatus({
            statusMerkleRoot: statusMerkleRoot,
            activeCount: activeCount,
            revokedCount: revokedCount,
            anchoredAt: block.timestamp,
            anchoredBy: msg.sender
        });

        latestEpoch = epochId;

        emit EpochStatusRootAnchored(
            epochId,
            statusMerkleRoot,
            activeCount,
            revokedCount,
            block.timestamp,
            msg.sender
        );
    }

    /**
     * @notice Get status root for a specific epoch.
     */
    function getEpochStatus(uint256 epochId)
        external
        view
        returns (
            bytes32 statusMerkleRoot,
            uint32 activeCount,
            uint32 revokedCount,
            uint256 anchoredAt,
            address anchoredBy
        )
    {
        EpochStatus storage status = _epochRoots[epochId];
        require(status.anchoredAt > 0, "StatusRegistry: epoch not yet anchored");
        return (
            status.statusMerkleRoot,
            status.activeCount,
            status.revokedCount,
            status.anchoredAt,
            status.anchoredBy
        );
    }

    /**
     * @notice Verify if a candidate root matches the anchored root for an epoch.
     */
    function verifyEpochRoot(uint256 epochId, bytes32 candidateRoot) external view returns (bool) {
        return _epochRoots[epochId].statusMerkleRoot == candidateRoot && _epochRoots[epochId].anchoredAt > 0;
    }
}
