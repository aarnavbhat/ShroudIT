// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title DocumentVerifier
 * @dev Verifies Merkle inclusion proofs for paper/QR document certificates.
 * Allows residents to prove training/concession certificates offline via QR code
 * with salted commitments checked against the on-chain Merkle root.
 */
contract DocumentVerifier {
    /**
     * @notice Verify a Merkle inclusion proof for a given leaf and root.
     * @param leaf The salted SHA-256 hash commitment of the document credential
     * @param root The anchored Merkle root in the registry
     * @param siblings The sibling proof hashes along the Merkle tree path
     * @param isRight Position boolean for each sibling (true if sibling is on the right)
     */
    function verifyInclusionProof(
        bytes32 leaf,
        bytes32 root,
        bytes32[] calldata siblings,
        bool[] calldata isRight
    ) external pure returns (bool) {
        require(siblings.length == isRight.length, "DocumentVerifier: invalid proof length");

        bytes32 computedHash = leaf;

        for (uint256 i = 0; i < siblings.length; i++) {
            bytes32 sibling = siblings[i];
            if (isRight[i]) {
                computedHash = sha256(abi.encodePacked(computedHash, sibling));
            } else {
                computedHash = sha256(abi.encodePacked(sibling, computedHash));
            }
        }

        return computedHash == root;
    }
}
