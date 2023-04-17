const { getNamedAccounts } = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
    const { deployer } = await getNamedAccounts();
    const FundMe = await ethers.getContract("FundMe", deployer);
    console.log("Funding contract to withdraw...");
    const transactionResponse = await FundMe.withdraw();
    await transactionResponse.wait(1);
    console.log("Withdrawn!");
}

main()
    .then(() => process.exit(0))
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })