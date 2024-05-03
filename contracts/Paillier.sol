// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "./BigNum.sol";

/// @title Paillier Cryptosystem Implementation
/// @author The developer
/// @notice This contract provides basic operations for the Paillier cryptosystem
/// @dev Uses the BigNum library for large number operations
contract Paillier {
    using BigNum for *;

    /// @notice Adds two encrypted values
    /// @dev Addition of two encrypted values is performed using BigNum for modular arithmetic
    /// @param a The first encrypted value in bytes
    /// @param b The second encrypted value in bytes
    /// @param publicKey The public key in bytes
    /// @return enc_sum The encrypted sum as a BigNumber
    function add(
        bytes calldata a,
        bytes calldata b,
        bytes calldata publicKey
    ) public view returns (BigNumber memory) {
        // Create BigNumber representations for the encrypted values and the public key
        BigNumber memory enc_a = BigNumber(a, false, BigNum.bitLength(a));
        BigNumber memory enc_b = BigNumber(b, false, BigNum.bitLength(b));
        BigNumber memory pub_n = BigNumber(
            publicKey,
            false,
            BigNum.bitLength(publicKey)
        );

        // Calculate the encrypted sum as enc_a * enc_b % pub_n^2
        BigNumber memory enc_sum = BigNum.mod(
            BigNum.mul(enc_a, enc_b),
            BigNum.pow(pub_n, 2)
        );

        return enc_sum;
    }

    /// @notice Multiplies an encrypted value by a plaintext constant
    /// @dev The encrypted value is exponentiated to the plaintext constant and then taken modulo n^2
    /// @param a The encrypted value in bytes
    /// @param b The plaintext constant
    /// @param publicKey The public key in bytes
    /// @return enc_result The encrypted result as a BigNumber
    function mul(
        bytes calldata a,
        uint256 b,
        bytes calldata publicKey
    ) public view returns (BigNumber memory) {
        // Create BigNumber representations for the encrypted value and the public key
        BigNumber memory enc_value = BigNumber(a, false, BigNum.bitLength(a));
        BigNumber memory pub_n = BigNumber(
            publicKey,
            false,
            BigNum.bitLength(publicKey)
        );

        // Calculate the encrypted result as enc_value^b % pub_n^2
        BigNumber memory enc_result = BigNum.mod(
            BigNum.pow(enc_value, b),
            BigNum.pow(pub_n, 2)
        );

        return enc_result;
    }

    /// @notice Encrypts zero using a random value and a public key
    /// @dev The encryption is performed as r^n % n^2, where r is the random value
    /// @param rnd The random value in bytes
    /// @param publicKey The public key in bytes
    /// @return enc_zero The encrypted zero as a BigNumber
    function encryptZero(
        bytes calldata rnd,
        bytes calldata publicKey
    ) public view returns (BigNumber memory) {
        // Create BigNumber representations for the random value and the public key
        BigNumber memory rand = BigNumber(rnd, false, BigNum.bitLength(rnd));
        BigNumber memory pub_n = BigNumber(
            publicKey,
            false,
            BigNum.bitLength(publicKey)
        );

        // Calculate the encrypted zero as r^n % n^2
        BigNumber memory enc_zero = BigNum.mod(
            BigNum.mul(rand, pub_n),
            BigNum.pow(pub_n, 2)
        );

        return enc_zero;
    }

    /// @notice Decrypts an encrypted value using a private key and a public key
    /// @dev The decryption is performed as (c^lambda % n^2) % n, where lambda is the private key
    /// @param encValue The encrypted value in bytes
    /// @param privateKey The private key in bytes
    /// @param publicKey The public key in bytes
    /// @return decryptedValue The decrypted value as a BigNumber
    function decrypt(
        bytes calldata encValue,
        bytes calldata privateKey,
        bytes calldata publicKey
    ) public view returns (BigNumber memory) {
        // Create BigNumber representations for the encrypted value, private key, and public key
        BigNumber memory enc_value = BigNumber(
            encValue,
            false,
            BigNum.bitLength(encValue)
        );
        BigNumber memory lambda = BigNumber(
            privateKey,
            false,
            BigNum.bitLength(privateKey)
        );
        BigNumber memory n = BigNumber(
            publicKey,
            false,
            BigNum.bitLength(publicKey)
        );

        // Decrypt the value using private key lambda
        BigNumber memory decryptedValue = BigNum.modexp(
            enc_value,
            lambda,
            BigNum.pow(n, 2)
        );

        // Modulo operation to ensure the result is within range
        decryptedValue = BigNum.mod(decryptedValue, n);

        return decryptedValue;
    }
}
