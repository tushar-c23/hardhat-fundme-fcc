const { getNamedAccounts } = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
    const { deployer } = await getNamedAccounts();
    const FundMe = await ethers.getContract("FundMe", deployer);
    console.log("Funding contract...");
    const transactionResponse = await FundMe.fund({ value: ethers.utils.parseEther("1") });
    await transactionResponse.wait(1);
    console.log("Funded!");
}

main()
    .then(() => process.exit(0))
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })