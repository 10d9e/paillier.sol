// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./DiscreteERC20.sol";
import "./Paillier.sol";
import "./PaillierProofVerifier.sol";

/// @title DiscreteERC20Bridge
/// @dev Wraps a standard ERC20 token, enabling encrypted transactions through the DiscreteERC20 contract.
contract DiscreteERC20Bridge {
    IERC20 public immutable underlyingToken;
    DiscreteERC20 public discreteToken;
    Paillier private immutable paillier;
    PublicKey public publicKey;
    Groth16Verifier public verifier; // zk-SNARK verifier contract

    /// @notice Event emitted when a user deposits ERC20 tokens to mint encrypted tokens.
    event Deposit(address indexed user, uint256 amount, Ciphertext encryptedAmount);

    /// @notice Event emitted when a user withdraws by burning encrypted tokens.
    event Withdraw(address indexed user, uint256 amount);

    /// @notice Event emitted when a user transfers encrypted tokens.
    event TransferEncrypted(address indexed from, address indexed to, Ciphertext amount);

    /// @param _underlyingToken Address of the standard ERC20 token.
    /// @param _discreteToken Address of the DiscreteERC20 contract.
    /// @param _paillier Address of the Paillier contract.
    /// @param _publicKey Public key for Paillier encryption.
    constructor(
        address _underlyingToken,
        address _discreteToken,
        address _paillier,
        PublicKey memory _publicKey,
        address _verifier
    ) {
        underlyingToken = IERC20(_underlyingToken);
        discreteToken = DiscreteERC20(_discreteToken);
        paillier = Paillier(_paillier);
        publicKey = _publicKey;
        verifier = Groth16Verifier(_verifier);
    }

    function verifyProof(
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c,
        uint256[3] calldata input
    ) public view returns (bool) {
        // todo: integrate verifier
        return true;
        // return verifier.verifyProof(a, b, c, input);
    }

    /// @notice Deposit ERC20 tokens and mint encrypted tokens.
    /// @param amount The amount of ERC20 tokens to deposit.
    function deposit(uint256 amount) external {
        require(amount > 0, "Cannot deposit zero tokens");
        require(underlyingToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        bytes memory randomValue = _generateRandomValue();
        BigNumber memory encryptedAmount = paillier.encrypt(amount, randomValue, publicKey);
        Ciphertext memory ciphertext = Ciphertext(encryptedAmount.val);

        discreteToken.mint(msg.sender, ciphertext);
        emit Deposit(msg.sender, amount, ciphertext);
    }

    /// @notice Transfer encrypted tokens between users.
    /// @param to The recipient address.
    /// @param encryptedAmount The encrypted amount to transfer.
    function transferEncrypted(address to, Ciphertext calldata encryptedAmount) external {
        discreteToken.transfer_proxy(msg.sender, to, encryptedAmount);
        emit TransferEncrypted(msg.sender, to, encryptedAmount);
    }

    /// @notice Withdraw ERC20 tokens by burning encrypted tokens.
    /// @param amount The amount to withdraw.
    function withdraw(
        uint256 amount,
        uint256[2] calldata pok_a,
        uint256[2][2] calldata pok_b,
        uint256[2] calldata pok_c,
        uint256[3] calldata pok_input
    ) external {
        require(verifyProof(pok_a, pok_b, pok_c, pok_input), "zk-pok invalid");
        require(amount > 0, "Invalid amount");
        require(underlyingToken.transfer(msg.sender, amount), "Transfer failed");

        discreteToken.burn(msg.sender, discreteToken.getBalance(msg.sender));

        emit Withdraw(msg.sender, amount);
    }

    /// @dev Generates a random value for encryption.
    function _generateRandomValue() internal view returns (bytes memory) {
        return abi.encodePacked(block.timestamp, msg.sender);
    }

    /// @dev Converts a BigNumber to uint256.
    function _bigNumberToUint256(BigNumber memory bn) internal pure returns (uint256) {
        return abi.decode(bn.val, (uint256));
    }

    /// @dev Returns the private key (mocked, should be handled off-chain).
    function _getPrivateKey() internal pure returns (PrivateKey memory) {
        return PrivateKey("", "");
    }
}
