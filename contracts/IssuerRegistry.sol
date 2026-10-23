// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IssuerRegistry
 * @dev On-chain trust anchor for accredited credential issuers in ShroudIT.
 * Holds DIDs, BLS12-381 / Ed25519 public keys, and supported schema hashes.
 * Ensures that verifiers can independently verify issuer accreditation off-chain.
 */
contract IssuerRegistry {
    struct Issuer {
        string did;
        string name;
        bytes publicKey; // BLS12-381 G2 public key or Ed25519 public key bytes
        bool isActive;
        uint256 registeredAt;
        uint256 revokedAt;
        bytes32[] supportedSchemas; // Hashes of authorized credential schemas
    }

    address public owner;
    
    // Mapping from issuer DID string to Issuer struct
    mapping(string => Issuer) private _issuers;
    
    // Array of all registered issuer DIDs for public enumeration
    string[] private _allIssuerDids;
    
    // Quick lookup: is schema supported by issuer
    mapping(string => mapping(bytes32 => bool)) private _issuerSchemaLookup;

    event IssuerRegistered(
        string indexed didIndex,
        string did,
        string name,
        bytes publicKey,
        uint256 timestamp
    );
    
    event IssuerRevoked(
        string indexed didIndex,
        string did,
        string reason,
        uint256 timestamp
    );
    
    event IssuerKeyUpdated(
        string indexed didIndex,
        string did,
        bytes newPublicKey,
        uint256 timestamp
    );

    event SchemaAuthorized(
        string indexed didIndex,
        string did,
        bytes32 indexed schemaHash
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "IssuerRegistry: caller is not the owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice Register a newly accredited civic authority.
     */
    function registerIssuer(
        string calldata did,
        string calldata name,
        bytes calldata publicKey,
        bytes32[] calldata initialSchemas
    ) external onlyOwner {
        require(bytes(did).length > 0, "IssuerRegistry: DID cannot be empty");
        require(publicKey.length > 0, "IssuerRegistry: public key cannot be empty");
        require(!_issuers[did].isActive, "IssuerRegistry: issuer already active");

        Issuer storage newIssuer = _issuers[did];
        newIssuer.did = did;
        newIssuer.name = name;
        newIssuer.publicKey = publicKey;
        newIssuer.isActive = true;
        newIssuer.registeredAt = block.timestamp;
        newIssuer.revokedAt = 0;
        newIssuer.supportedSchemas = initialSchemas;

        _allIssuerDids.push(did);

        for (uint256 i = 0; i < initialSchemas.length; i++) {
            _issuerSchemaLookup[did][initialSchemas[i]] = true;
            emit SchemaAuthorized(did, did, initialSchemas[i]);
        }

        emit IssuerRegistered(did, did, name, publicKey, block.timestamp);
    }

    /**
     * @notice Revoke accreditation of an issuer (e.g. if key is compromised).
     */
    function revokeIssuer(string calldata did, string calldata reason) external onlyOwner {
        require(_issuers[did].isActive, "IssuerRegistry: issuer not active");
        
        _issuers[did].isActive = false;
        _issuers[did].revokedAt = block.timestamp;

        emit IssuerRevoked(did, did, reason, block.timestamp);
    }

    /**
     * @notice Rotate an issuer's cryptographic public key.
     */
    function updateIssuerKey(string calldata did, bytes calldata newPublicKey) external onlyOwner {
        require(_issuers[did].isActive, "IssuerRegistry: issuer not active");
        require(newPublicKey.length > 0, "IssuerRegistry: invalid key length");

        _issuers[did].publicKey = newPublicKey;

        emit IssuerKeyUpdated(did, did, newPublicKey, block.timestamp);
    }

    /**
     * @notice Query whether an issuer is accredited.
     */
    function isIssuerAccredited(string calldata did) external view returns (bool) {
        return _issuers[did].isActive;
    }

    /**
     * @notice Verify whether an issuer is authorized to issue a specific schema.
     */
    function supportsSchema(string calldata did, bytes32 schemaHash) external view returns (bool) {
        return _issuers[did].isActive && _issuerSchemaLookup[did][schemaHash];
    }

    /**
     * @notice Get full issuer details.
     */
    function getIssuer(string calldata did)
        external
        view
        returns (
            string memory name,
            bytes memory publicKey,
            bool isActive,
            uint256 registeredAt,
            uint256 revokedAt,
            bytes32[] memory supportedSchemas
        )
    {
        Issuer storage iss = _issuers[did];
        return (
            iss.name,
            iss.publicKey,
            iss.isActive,
            iss.registeredAt,
            iss.revokedAt,
            iss.supportedSchemas
        );
    }

    /**
     * @notice Get total count of registered issuers.
     */
    function totalIssuers() external view returns (uint256) {
        return _allIssuerDids.length;
    }

    /**
     * @notice Get DID at given index.
     */
    function getIssuerDidByIndex(uint256 index) external view returns (string memory) {
        require(index < _allIssuerDids.length, "IssuerRegistry: index out of bounds");
        return _allIssuerDids[index];
    }
}
