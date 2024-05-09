// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../Paillier.sol";

// Secp256k1Ciphertext struct
struct Secp256k1Ciphertext {
    bytes iv;
    bytes ephemPublicKey;
    bytes ciphertext;
    bytes mac;
}

/// @title DiscreteERC20: An ERC20 token contract with encrypted balances using the Paillier cryptosystem
/// @dev This contract demonstrates an example of an ERC20 token where balances are encrypted to preserve user privacy.
contract DiscreteERC20 {
    /// @dev Instance of the Paillier contract for cryptographic operations
    Paillier private paillier;

    /// @dev Public key structure used for the Paillier encryption
    PublicKey public publicKey;

    /// @notice An event emitted when a transfer of tokens is made
    /// @param from Address sending the tokens
    /// @param to Address receiving the tokens
    /// @param value Amount of tokens transferred, represented as encrypted data
    event Transfer(address indexed from, address indexed to, Ciphertext value);

    /// @notice An event emitted when a spender is approved to spend tokens
    /// @param owner Address owning the tokens
    /// @param spender Address authorized to spend the tokens
    /// @param value Amount of tokens approved, represented as encrypted data
    event Approval(address indexed owner, address indexed spender, Ciphertext value);

    /// @notice An event emitted when a balance request is initiated
    /// @param account Address whose balance is being requested
    event RequestBalance(address indexed account);

    /// @notice An event emitted in response to a balance request
    /// @param account Address whose balance was requested
    /// @param balance The balance of the account (unencrypted for event)
    event ResponseBalance(address indexed account, Secp256k1Ciphertext balance);

    /// @dev The total supply of tokens, encrypted
    Ciphertext public totalSupply;

    /// @dev Mapping of encrypted balances per address
    mapping(address => Ciphertext) public balanceOf;

    /// @dev Nested mapping to manage encrypted allowances
    mapping(address => mapping(address => Ciphertext)) public allowance;

    /// @notice The name of the token
    string public name;

    /// @notice The symbol of the token
    string public symbol;

    /// @notice The number of decimals the token uses
    uint8 public decimals;

    /// @notice Constructor to set initial token details and cryptographic components
    /// @param _name Name of the token
    /// @param _symbol Symbol of the token
    /// @param _decimals Number of decimal places the token uses
    /// @param _paillier Address of the Paillier contract
    /// @param _publicKey Public key for the Paillier encryption
    constructor(
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        Ciphertext memory _initialSupply,
        address _paillier,
        PublicKey memory _publicKey
    ) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        paillier = Paillier(_paillier);
        publicKey = _publicKey;
        totalSupply = _initialSupply;
    }

    /// @notice Emits an event to request the balance of the sender
    function requestBalance() external {
        emit RequestBalance(msg.sender);
    }

    /// @notice Emits an event with the response balance for a specified address
    /// @param target The address whose balance is being reported
    /// @param balance The balance of the specified address
    function responseBalance(address target, Secp256k1Ciphertext calldata balance) external {
        emit ResponseBalance(target, balance);
    }

    /// @notice Transfers encrypted tokens to a specified address
    /// @param recipient The address to receive the tokens
    /// @param amount The amount of tokens to transfer, represented as encrypted data
    /// @return success A boolean value indicating success of the transfer
    function transfer(address recipient, Ciphertext calldata amount) external returns (bool success) {
        require(
            keccak256(abi.encodePacked(balanceOf[msg.sender].value)) != keccak256(bytes("")),
            "DiscreteERC20: transfer from the zero address"
        );

        if (keccak256(abi.encodePacked(balanceOf[recipient].value)) == keccak256(bytes(""))) {
            balanceOf[recipient] = amount;
        } else {
            balanceOf[recipient] = this._add(balanceOf[recipient], amount);
        }
        balanceOf[msg.sender] = this._sub(balanceOf[msg.sender], amount);
        emit Transfer(msg.sender, recipient, amount);
        return true;
    }

    /// @dev Internal function to mint new encrypted tokens
    /// @param to The address to receive the newly minted tokens
    /// @param amount The amount of tokens to mint, represented as encrypted data
    function _mint(address to, Ciphertext calldata amount) internal {
        if (keccak256(abi.encodePacked(balanceOf[to].value)) == keccak256(bytes(""))) {
            balanceOf[to] = amount;
        } else {
            balanceOf[to] = this._add(balanceOf[to], amount);
        }
        totalSupply = this._add(totalSupply, amount);
        emit Transfer(address(0), to, amount);
    }

    /// @dev Internal function to burn encrypted tokens
    /// @param from The address from which tokens are burned
    /// @param amount The amount of tokens to burn, represented as encrypted data
    function _burn(address from, Ciphertext calldata amount) internal {
        balanceOf[from] = this._sub(balanceOf[from], amount);
        totalSupply = this._sub(totalSupply, amount);
        emit Transfer(from, address(0), amount);
    }

    /// @notice External function to mint new encrypted tokens
    /// @param to The address to receive the newly minted tokens
    /// @param amount The amount of tokens to mint, represented as encrypted data
    function mint(address to, Ciphertext calldata amount) external {
        _mint(to, amount);
    }

    /// @notice External function to burn encrypted tokens
    /// @param from The address from which tokens are burned
    /// @param amount The amount of tokens to burn, represented as encrypted data
    function burn(address from, Ciphertext calldata amount) external {
        _burn(from, amount);
    }

    /// @dev Internal function to add two encrypted values
    /// @param a The first encrypted value
    /// @param b The second encrypted value
    /// @return The result of the addition, represented as encrypted data
    function _add(Ciphertext calldata a, Ciphertext calldata b) public view returns (Ciphertext memory) {
        return Ciphertext(paillier.add(a, b, publicKey).val);
    }

    /// @dev Internal function to subtract one encrypted value from another
    /// @param a The encrypted value to subtract from
    /// @param b The encrypted value to subtract
    /// @return The result of the subtraction, represented as encrypted data
    function _sub(Ciphertext calldata a, Ciphertext calldata b) public view returns (Ciphertext memory) {
        return Ciphertext(paillier.sub(a, b, publicKey).val);
    }
}
