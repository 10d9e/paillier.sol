# Paillier Solidity Smart Contract

This Solidity smart contract provides functionalities for performing homomorphic encryption using the Paillier cryptosystem on the Ethereum blockchain. Homomorphic encryption allows computations to be performed on encrypted data without decrypting it first, providing privacy and security benefits.

# Features

- Addition of two encrypted values.
- Subtraction of two encrypted values.
- Multiplication of an encrypted value by a plaintext constant.
- Subtraction of a plaintext constant from an encrypted value.
- Addition of an encrypted value with a plaintext value.
- Encryption of zero.

# Installation

To use this smart contract, you need to deploy it on the Ethereum blockchain. You'll also need to import the BigNumbers.sol library for handling large numbers.

# Usage

1. Deploy the PaillierSolidity contract on the Ethereum blockchain.
2. Import the contract into your Solidity code.
3. Use the provided functions to perform homomorphic encryption operations.

# Use Cases

The Paillier cryptosystem, which is homomorphic with respect to addition and multiplication, can be applied in various blockchain-based applications that require privacy-preserving computation. 

Included is a comprehensive [DiscreteERC20](contracts/examples/DiscreteERC20.sol) contract, demonstrating the library's homomorphic properties with an Ethereum Token, preserving transaction privacy onchain.

Here are five possible applications with corresponding example Solidity code snippets:

## Private Voting System

In a voting system, votes can be encrypted using the Paillier cryptosystem. Each encrypted vote is a ciphertext representing either 0 or 1 (abstention or cast vote). The final tally can be computed without decrypting the individual votes.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./Paillier.sol";

contract PrivateVoting {
    Paillier public paillier;
    address public owner;
    BigNumber[] public encryptedVotes;

    constructor(address _paillier) {
        paillier = Paillier(_paillier);
        owner = msg.sender;
    }

    function submitVote(bytes calldata vote, bytes calldata publicKey) public {
        encryptedVotes.push(BigNumber(vote, false, BigNum.bitLength(vote)));
    }

    function tallyVotes(bytes calldata publicKey) public view returns (BigNumber memory) {
        BigNumber memory total = encryptedVotes[0];
        for (uint256 i = 1; i < encryptedVotes.length; i++) {
            total = paillier.add(total.toBytes(), encryptedVotes[i].toBytes(), publicKey);
        }
        return total;
    }
}
```

## Privacy-Preserving Payroll:

Payroll can be computed on-chain while preserving employees' salary privacy. Each employee's encrypted salary can be stored, and payroll totals can be computed without revealing individual salaries.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./Paillier.sol";

contract PrivatePayroll {
    Paillier public paillier;
    address public owner;
    mapping(address => BigNumber) public encryptedSalaries;

    constructor(address _paillier) {
        paillier = Paillier(_paillier);
        owner = msg.sender;
    }

    function setSalary(address employee, bytes calldata encryptedSalary, bytes calldata publicKey) public {
        require(msg.sender == owner, "Only owner can set salary");
        encryptedSalaries[employee] = BigNumber(encryptedSalary, false, BigNum.bitLength(encryptedSalary));
    }

    function totalPayroll(bytes calldata publicKey) public view returns (BigNumber memory) {
        BigNumber memory total = BigNumber("0", false, 1);
        for (address employee : encryptedSalaries) {
            total = paillier.add(total.toBytes(), encryptedSalaries[employee].toBytes(), publicKey);
        }
        return total;
    }
}
```

## Anonymous Donations:

In a charitable donation system, donors' contributions can be kept private. The total amount donated can be computed and verified without revealing individual contributions.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./Paillier.sol";

contract AnonymousDonations {
    Paillier public paillier;
    address public owner;
    BigNumber[] public encryptedDonations;

    constructor(address _paillier) {
        paillier = Paillier(_paillier);
        owner = msg.sender;
    }

    function donate(bytes calldata encryptedAmount, bytes calldata publicKey) public {
        encryptedDonations.push(BigNumber(encryptedAmount, false, BigNum.bitLength(encryptedAmount)));
    }

    function totalDonations(bytes calldata publicKey) public view returns (BigNumber memory) {
        BigNumber memory total = encryptedDonations[0];
        for (uint256 i = 1; i < encryptedDonations.length; i++) {
            total = paillier.add(total.toBytes(), encryptedDonations[i].toBytes(), publicKey);
        }
        return total;
    }
}
```

## Private Auction:

In a private auction, bids can be encrypted, and the winner can be determined without revealing other bidders' bid amounts.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./Paillier.sol";

contract PrivateAuction {
    Paillier public paillier;
    address public owner;
    mapping(address => BigNumber) public encryptedBids;
    address public highestBidder;
    BigNumber public highestBid;

    constructor(address _paillier) {
        paillier = Paillier(_paillier);
        owner = msg.sender;
        highestBid = BigNumber("0", false, 1);
    }

    function placeBid(address bidder, bytes calldata encryptedBid, bytes calldata publicKey) public {
        BigNumber memory currentBid = BigNumber(encryptedBid, false, BigNum.bitLength(encryptedBid));
        encryptedBids[bidder] = currentBid;

        // Compare the new bid with the highest bid so far
        if (paillier.compare(currentBid.toBytes(), highestBid.toBytes(), publicKey) > 0) {
            highestBidder = bidder;
            highestBid = currentBid;
        }
    }

    function getHighestBid() public view returns (address, BigNumber memory) {
        return (highestBidder, highestBid);
    }
}
```

## Private Tax Calculation:

Tax calculations can be carried out on-chain while keeping individual taxpayers' incomes private. The total tax owed can be computed without revealing individual incomes.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./Paillier.sol";

contract PrivateTaxCalculation {
    Paillier public paillier;
    address public owner;
    mapping(address => BigNumber) public encryptedIncomes;
    uint256 public taxRate;

    constructor(address _paillier, uint256 _taxRate) {
        paillier = Paillier(_paillier);
        owner = msg.sender;
        taxRate = _taxRate;
    }

    function setIncome(address taxpayer, bytes calldata encryptedIncome, bytes calldata publicKey) public {
        require(msg.sender == owner, "Only owner can set income");
        encryptedIncomes[taxpayer] = BigNumber(encryptedIncome, false, BigNum.bitLength(encryptedIncome));
    }

    function totalTax(bytes calldata publicKey) public view returns (BigNumber memory) {
        BigNumber memory total = BigNumber("0", false, 1);
        for (address taxpayer : encryptedIncomes) {
            BigNumber memory tax = paillier.mul(encryptedIncomes[taxpayer].toBytes(), taxRate, publicKey);
            total = paillier.add(total.toBytes(), tax.toBytes(), publicKey);
        }
        return total;
    }
}
```

# References

https://github.com/jahali6128/paillier-solidity
