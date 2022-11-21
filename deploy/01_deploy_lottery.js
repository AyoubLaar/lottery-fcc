const { network, ethers } = require("hardhat");
const {
  networkconfig,
  DevelopmentChain,
} = require("../helper_hardhat_config.js");

const { verify } = require("../utils/verify.js");

const VRF_FUND_AMOUNT = ethers.utils.parseEther("1");

module.exports.default = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  let vrfcoordinatorV2address, subscriptionId;
  const CHAINID = network.config.chainId;

  if (DevelopmentChain.includes(network.name.toLowerCase())) {
    const vrfcoordinatorV2Mock = await ethers.getContract(
      "VRFCoordinatorV2Mock"
    );
    vrfcoordinatorV2address = vrfcoordinatorV2Mock.address;
    const transcationResponse = await vrfcoordinatorV2Mock.createSubscription();
    const transactionReceipt = await transcationResponse.wait(1);
    subscriptionId = transactionReceipt.events[0].args.subId;
    await vrfcoordinatorV2Mock.fundSubscription(
      subscriptionId,
      VRF_FUND_AMOUNT
    );
  } else {
    vrfcoordinatorV2address = networkconfig[CHAINID]["vrfcoordinatorV2"];
    subscriptionId = networkconfig[CHAINID]["subscriptionId"];
  }

  const ENTRANCEFEE = networkconfig[CHAINID]["entranceFee"];
  const GASLANE = networkconfig[CHAINID]["gasLane"];
  const CALLBACKGASLIMIT = networkconfig[CHAINID]["callbackgaslimit"];
  const INTERVAL = networkconfig[CHAINID]["interval"];

  /* address vrfCoordinatorV2, //contract
    uint256 _entranceFee,
    bytes32 _gasLane,
    uint64 _subscriptionId,
    uint32 _callbackGasLimit,
    uint256 _intervall */

  const arguments = [
    vrfcoordinatorV2address,
    ENTRANCEFEE,
    GASLANE,
    subscriptionId,
    CALLBACKGASLIMIT,
    INTERVAL,
  ];

  console.log("Deploying lottery...");

  const lottery = await deploy("lottery", {
    from: deployer,
    args: arguments,
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });

  console.log("lottery Deployed !");

  if (
    !DevelopmentChain.includes(network.name.toLowerCase()) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    await verify(lottery.address, arguments);
  }
  console.log("----------------------------------\n\n");
};

module.exports.tags = ["all", "lottery"];
