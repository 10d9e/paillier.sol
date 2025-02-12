// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./DiscreteERC20.sol";
import "./Paillier.sol";

/// @title DiscreteERC20Bridge
/// @dev Wraps a standard ERC20 token, enabling encrypted transactions through the DiscreteERC20 contract.
contract DiscreteERC20Bridge {
    IERC20 public immutable underlyingToken;
    DiscreteERC20 public immutable discreteToken;
    Paillier private immutable paillier;
    PublicKey public publicKey;

    /// @notice Event emitted when a user deposits ERC20 tokens to mint encrypted tokens.
    event Deposit(address indexed user, uint256 amount, Ciphertext encryptedAmount);

    /// @notice Event emitted when a user withdraws by burning encrypted tokens.
    event Withdraw(address indexed user, uint256 amount, Ciphertext encryptedAmount);

    /// @notice Event emitted when a user transfers encrypted tokens.
    event TransferEncrypted(address indexed from, address indexed to, Ciphertext amount);

    /// @param _underlyingToken Address of the standard ERC20 token.
    /// @param _discreteToken Address of the DiscreteERC20 contract.
    /// @param _paillier Address of the Paillier contract.
    /// @param _publicKey Public key for Paillier encryption.
    constructor(address _underlyingToken, address _discreteToken, address _paillier, PublicKey memory _publicKey) {
        underlyingToken = IERC20(_underlyingToken);
        discreteToken = DiscreteERC20(_discreteToken);
        paillier = Paillier(_paillier);
        publicKey = _publicKey;
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
    /// @param encryptedAmount The encrypted amount to withdraw.
    function withdraw(Ciphertext calldata encryptedAmount) external {
        BigNumber memory decryptedAmount = paillier.decrypt(encryptedAmount, publicKey, _getPrivateKey(), "");
        uint256 amount = _bigNumberToUint256(decryptedAmount);

        require(amount > 0, "Invalid amount");
        require(underlyingToken.transfer(msg.sender, amount), "Transfer failed");

        discreteToken.burn(msg.sender, encryptedAmount);

        emit Withdraw(msg.sender, amount, encryptedAmount);
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
