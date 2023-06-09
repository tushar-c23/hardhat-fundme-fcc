const { getNamedAccounts } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config.js");
const { assert } = require("chai");

developmentChains.includes(network.name)
    ? describe.skip :
    describe("FundMe",async function () {
        let fundMe;
        let deployer;
        const sendValue = ethers.utils.parseEther("1");

        beforeEach(async function () {
            deployer = (await getNamedAccounts()).deployer;
            fundMe = await ethers.getContract("FundMe", deployer);
            // we will not deploy here because we are assuming we have already deployed the contract
            // we don't need a mock because we are assuming we are testing for a mainnet
        })

        it("allows people to fund and withdraw", async function () {
            await fundMe.fund({value: sendValue});
            await fundMe.withdraw();
            const endingBalance = await fundMe.provider.getBalance(fundMe.address);

            assert.equal(endingBalance.toString(), "0");
        })
    })