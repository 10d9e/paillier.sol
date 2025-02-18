import paillierBigint from "paillier-bigint";
import fs from "fs";
import path from "path";

// Define file path for storing keys
const KEY_FILE_PATH = path.resolve(__dirname, "../../paillierKeys.json");

// PublicKey type
export interface PublicKey {
    n: string;
    g: string;
}

// PrivateKey type
export interface PrivateKey {
    lambda: string;
    mu: string;
}

// Ciphertext type
export interface Ciphertext {
    value: string;
}

/**
 * Generates a new Paillier key pair (256-bit) and saves it to a file.
 */
export const precomputeKeys = async (): Promise<void> => {
    console.log("Generating new Paillier key pair...");
    const keyPair = await paillierBigint.generateRandomKeys(256);

    const keys = {
        publicKey: {
            n: keyPair.publicKey.n.toString(),
            g: keyPair.publicKey.g.toString()
        },
        privateKey: {
            lambda: keyPair.privateKey.lambda.toString(),
            mu: keyPair.privateKey.mu.toString()
        }
    };

    // Save the keys to a JSON file
    fs.writeFileSync(KEY_FILE_PATH, JSON.stringify(keys, null, 2));
    console.log(`Paillier keys generated and stored in ${KEY_FILE_PATH}`);
};

/**
 * Retrieves the stored Paillier keys from a file.
 */
export const getPaillierKeys = (): { publicKey: PublicKey; privateKey: PrivateKey } => {
    if (!fs.existsSync(KEY_FILE_PATH)) {
        throw new Error(`Paillier keys have not been precomputed. Run "npx hardhat run scripts/precomputeKeys.ts" first.`);
    }

    const keys = JSON.parse(fs.readFileSync(KEY_FILE_PATH, "utf-8"));
    return keys;
};
