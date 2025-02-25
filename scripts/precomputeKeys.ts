import { precomputeKeys } from "../ignition/types/CommonTypes";

async function main() {
    await precomputeKeys();
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
