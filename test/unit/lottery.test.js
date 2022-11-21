const {
  DevelopmentChain,
  networkconfig,
} = require("../../helper_hardhat_config.js");
const { network, getNamedAccounts, deployments, ethers } = require("hardhat");
const { assert } = require("chai");

!DevelopmentChain.includes(network.name.toLowerCase())
  ? describe.skip
  : describe("lottery unit testing", async () => {
      let lottery,
        vrfcoordinatorV2Mock,
        chainId = network.config.chainId;
      beforeEach(async () => {
        const { deployer } = await getNamedAccounts();
        await deployments.fixture();
        lottery = await ethers.getContract("lottery", deployer);
        vrfcoordinatorV2Mock = await ethers.getContract(
          "VRFCoordinatorV2Mock ",
          deployer
        );
      });
      describe("Constructor", async () => {
        it("initializes the constructor correctly", async () => {
          const lotteryState = await lottery.getLotteryState();
          const interval = await lottery.getInterval();
          assert.equal(lotteryState.toString(), "0");
          assert.equal(interval, networkconfig[chainId]["interval"]);
        });
      });
    });
