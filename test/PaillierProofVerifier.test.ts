import { expect } from "chai";
import { ethers } from "hardhat";

import { Groth16Verifier } from "../typechain-types";


describe("PaillierProofVerifier", function () {
    let verifier: Groth16Verifier;

    before(async function () {
        // Deploy PaillierProofVerifier
        verifier = await ethers.deployContract("Groth16Verifier");
        console.log("Verifier deployed to:", verifier.getAddress());
    });

    it("should return false for an invalid proof", async function () {
        const invalidProof = {
            a: [0, 0],
            b: [
                [0, 0],
                [0, 0]
            ],
            c: [0, 0],
            input: [0, 0, 0] // Replace with actual invalid input values
        };

        const result = await verifier.verifyProof(
            invalidProof.a,
            invalidProof.b,
            invalidProof.c,
            invalidProof.input
        );

        expect(result).to.be.false;
    });

    /*
    it("should accept a valid proof", async function () {
        // Ideally, generate a real proof using SnarkJS and pass it here.
        const validProof = {
            a: [0, 0],
            b: [
                [0, 0],
                [0, 0]
            ],
            c: [0, 0],
            input: [0, 0, 0]
        };

        const result = await verifier.verifyProof(
            validProof.a,
            validProof.b,
            validProof.c,
            validProof.input
        );

        expect(result).to.be.true; // Assuming valid proof data
    });
    */
});
