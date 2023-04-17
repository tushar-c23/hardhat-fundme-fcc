const { network } = require("hardhat");
require("dotenv").config();
const { verify } = require("../utils/verify");

const { networkConfig, developmentChains } = require("../helper-hardhat-config");

module.exports = async({ getNamedAccounts, deployments }) => {
    // const { getNamedAccounts, deployments } = hre;
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId;

    // const ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"];
    let ethUsdPriceFeedAddress;
    if(developmentChains.includes(network.name)) {
        const ethUsdAggregator = await deployments.get("MockV3Aggregator");
        ethUsdPriceFeedAddress = ethUsdAggregator.address;
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"];
    }

    // if the contract doesn't exist we deploy a minimal version of it for our local testing
    const args = [ethUsdPriceFeedAddress];

    const fundMe = await deploy("FundMe", {
        from : deployer, //who
        args: args, //arggs for constructor
        log: true, //print out logs
        waitConfirmations: network.config.blockConfirmations || 1,
    })
    log("FundMe deployed to: ", fundMe.address);

    if(!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        await verify(fundMe.address, args);
    }

    log("-----------------------------------------------------");

}

module.exports.tags = ["fundme","all"];