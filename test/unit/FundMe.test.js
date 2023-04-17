const { deployments, ethers, getNamedAccounts } = require("hardhat");
const { assert, expect } = require("chai");
const { developmentChains } = require("../../helper-hardhat-config");


!developmentChains.includes(network.name)
    ? describe.skip :
    describe("FundMe", async function () {
        let fundMe
        let deployer
        let mockV3Aggregator
        const sendValue = ethers.utils.parseEther("1"); //converts 1 ether to wei
        beforeEach(async function () {
            //deploy fundme with hardhat-deploy
            
            // const accounts = await ethers.getSigners(); //gives us a list of all the accounts in the network as defined in hardhat.config.js if we are on hardhat defaut network we get a list of 10 fake accounts
            // const accountOne = accounts[0]; //get the first account

            deployer = (await getNamedAccounts()).deployer
            await deployments.fixture(["all"]) // deploy all the deploy scripts with the tag "all"
            fundMe = await ethers.getContract("FundMe", deployer) //get the most recent deployment of contract with the name "FundMe"
            mockV3Aggregator = await ethers.getContract("MockV3Aggregator", deployer)

        })
        
        describe("constructor", async function () {
            it("sets the aggregator addresses correctly", async function () {
                const response = await fundMe.getPriceFeed()
                assert.equal(response, mockV3Aggregator.address)
            })
        })

        describe("fund", async function () {
            it("Fails if you don't send enought ETH", async function() {
                await expect(fundMe.fund()).to.be.revertedWith("You need to spend more ETH!"); //when we expect the function to fail
            })

            it("Updates the amount funded data structure", async function() {
                await fundMe.fund({value: sendValue})
                const response = await fundMe.getAddressToAmountFunded(
                    deployer
                )
                assert.equal(response.toString(), sendValue.toString());
            })

            it("Adds funder to array of getFunder", async function() {
                await fundMe.fund({value: sendValue})
                const funder = await fundMe.getFunder(0)
                assert.equal(funder, deployer);
            })
        })

        describe("withdraw", async function () {
            beforeEach(async function () {
                await fundMe.fund({value: sendValue})
            })

            it("Withdraw eth from a single founder", async () => {
                //Arange
                const startingFundMeBalance = await fundMe.provider.getBalance(
                    fundMe.address 
                )
                const startingDeployerBalance = await fundMe.provider.getBalance(
                    deployer
                )

                //Act
                const transactionResponse = await fundMe.withdraw();
                const transactionReceipt = await transactionResponse.wait(1);

                const { gasUsed, effectiveGasPrice } = transactionReceipt;
                const gasCost = gasUsed.mul(effectiveGasPrice);

                const endingFundMeBalance = await fundMe.provider.getBalance(
                    fundMe.address
                )
                const endingDeployerBalance = await fundMe.provider.getBalance(
                    deployer
                )

                //Assert
                assert.equal(endingFundMeBalance.toString(), 0);

                assert.equal(
                    startingFundMeBalance.add(startingDeployerBalance).toString(), endingDeployerBalance.add(gasCost).toString()
                );
            })

            it("Allows us to withdraw with multiple getFunder", async () => {
                // Arrange
                const accounts = await ethers.getSigners();
                for(let i = 1; i < 6; i++) {
                    const fundMeConnectedContract =  await fundMe.connect(accounts[i]); //call connect fundtion to connect to new account because previously we connected it to the deployer account only
                    await fundMeConnectedContract.fund({value: sendValue});
                }

                const startingFundMeBalance = await fundMe.provider.getBalance(
                    fundMe.address 
                )
                const startingDeployerBalance = await fundMe.provider.getBalance(
                    deployer
                )
                
                //Act
                const transactionResponse = await fundMe.withdraw();
                const transactionReceipt = await transactionResponse.wait(1);
                const { gasUsed, effectiveGasPrice } = transactionReceipt;
                const gasCost = gasUsed.mul(effectiveGasPrice);

                const endingFundMeBalance = await fundMe.provider.getBalance(
                    fundMe.address
                )
                const endingDeployerBalance = await fundMe.provider.getBalance(
                    deployer
                )

                //Assert
                assert.equal(endingFundMeBalance.toString(), 0);

                assert.equal(
                    startingFundMeBalance.add(startingDeployerBalance).toString(), endingDeployerBalance.add(gasCost).toString()
                );
                
                //Make sure getFunder are reset properly
                await expect((fundMe.getFunder(0))).to.be.reverted;

                for(i = 1; i < 6; i++) {
                    assert.equal(await fundMe.getAddressToAmountFunded(accounts[i].address), 0);
                }
            })

            it("Only allows the owner to withdraw", async () => {
                const accounts = await ethers.getSigners();
                const attacker = accounts[1];
                const attackerConnectedContract = await fundMe.connect(attacker);
                await expect(attackerConnectedContract.withdraw()).to.be.revertedWithCustomError(fundMe,"FundMe__NotOwner"); //when we expect custom error
            })

            it("cheaperWithdraw testing", async () => {
                // Arrange
                const accounts = await ethers.getSigners();
                for(let i = 1; i < 6; i++) {
                    const fundMeConnectedContract =  await fundMe.connect(accounts[i]); //call connect fundtion to connect to new account because previously we connected it to the deployer account only
                    await fundMeConnectedContract.fund({value: sendValue});
                }

                const startingFundMeBalance = await fundMe.provider.getBalance(
                    fundMe.address 
                )
                const startingDeployerBalance = await fundMe.provider.getBalance(
                    deployer
                )
                
                //Act
                const transactionResponse = await fundMe.cheaperWithdraw();
                const transactionReceipt = await transactionResponse.wait(1);
                const { gasUsed, effectiveGasPrice } = transactionReceipt;
                const gasCost = gasUsed.mul(effectiveGasPrice);

                const endingFundMeBalance = await fundMe.provider.getBalance(
                    fundMe.address
                )
                const endingDeployerBalance = await fundMe.provider.getBalance(
                    deployer
                )

                //Assert
                assert.equal(endingFundMeBalance.toString(), 0);

                assert.equal(
                    startingFundMeBalance.add(startingDeployerBalance).toString(), endingDeployerBalance.add(gasCost).toString()
                );
                
                //Make sure s_Funders are reset properly
                await expect((fundMe.getFunder(0))).to.be.reverted;

                for(i = 1; i < 6; i++) {
                    assert.equal(await fundMe.getAddressToAmountFunded(accounts[i].address), 0);
                }
            })

            it("[cheaperWithdraw] Withdraw eth from a single founder", async () => {
                //Arange
                const startingFundMeBalance = await fundMe.provider.getBalance(
                    fundMe.address 
                )
                const startingDeployerBalance = await fundMe.provider.getBalance(
                    deployer
                )

                //Act
                const transactionResponse = await fundMe.cheaperWithdraw();
                const transactionReceipt = await transactionResponse.wait(1);

                const { gasUsed, effectiveGasPrice } = transactionReceipt;
                const gasCost = gasUsed.mul(effectiveGasPrice);

                const endingFundMeBalance = await fundMe.provider.getBalance(
                    fundMe.address
                )
                const endingDeployerBalance = await fundMe.provider.getBalance(
                    deployer
                )

                //Assert
                assert.equal(endingFundMeBalance.toString(), 0);

                assert.equal(
                    startingFundMeBalance.add(startingDeployerBalance).toString(), endingDeployerBalance.add(gasCost).toString()
                );
            })
        })
    })