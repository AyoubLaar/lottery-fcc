const { ethers, network } = require("hardhat");
const { DevelopmentChain } = require("../helper_hardhat_config.js");

const BASE_FEE = ethers.utils.parseEther("0.25");
const GAS_PRICE_FEE = 1e9; // eth's price changes depending on the network

module.exports.default = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const args = [BASE_FEE, GAS_PRICE_FEE];

  if (DevelopmentChain.includes(network.name.toLowerCase())) {
    console.log("Local network detected , deploying mock...");
    await deploy("VRFCoordinatorV2Mock", {
      from: deployer,
      args: args,
      log: true,
    });
    console.log("Mocks deployed !");
    console.log("\n\n");
  }
};

module.exports.tags = ["all", "mocks"];
