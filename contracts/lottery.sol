//SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/interfaces/KeeperCompatibleInterface.sol";

//We want people to enter (paying a fee)
//We want to choose the winner randomly
//Winner to be selected every X minutes

error lottery_entrance_fee_not_met();
error lottery_transfer_failed();
error lottery_not_open();
error lottery_not_time_yet(
  uint256 lotteryState,
  uint256 playersNumber,
  uint256 currentBalance
);

contract lottery is VRFConsumerBaseV2, KeeperCompatibleInterface {
  /*Types*/
  enum lotteryState {
    OPEN,
    CALCULATING
  }

  /*state variables*/
  /*ChainlinkVRF variables*/
  VRFCoordinatorV2Interface private immutable i_coordinator;
  bytes32 private immutable i_gasLane;
  uint64 private immutable i_subscriptionId;
  uint32 private immutable i_callbackGasLimit;
  uint32 private constant NUMWORDS = 1;
  uint16 private constant REQUEST_CONFIRMATIONS = 3;

  /*lottery variables*/
  uint256 private immutable i_intervall;
  uint256 private immutable i_entranceFee;
  address payable[] private s_participents;
  address payable private s_recentWinner;
  uint256 private s_lastTimeStamp;
  lotteryState private s_state;

  /*events*/
  event lotteryEntered(address indexed participent);
  event requestedlotteryWinner(uint256 requestId);
  event declaredlotteryWinner(address indexed recentWinner);

  constructor(
    address vrfCoordinatorV2, //contract
    uint256 _entranceFee,
    bytes32 _gasLane,
    uint64 _subscriptionId,
    uint32 _callbackGasLimit,
    uint256 _intervall
  ) VRFConsumerBaseV2(vrfCoordinatorV2) {
    i_intervall = _intervall;
    i_entranceFee = _entranceFee;
    i_coordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
    i_gasLane = _gasLane;
    i_subscriptionId = _subscriptionId;
    i_callbackGasLimit = _callbackGasLimit;
    s_state = lotteryState.OPEN;
    s_lastTimeStamp = block.timestamp;
  }

  function Enter() public payable {
    if (msg.value < i_entranceFee) {
      revert lottery_entrance_fee_not_met();
    }
    if (s_state != lotteryState.OPEN) {
      revert lottery_not_open();
    }
    s_participents.push(payable(msg.sender));
    emit lotteryEntered(msg.sender);
  }

  /**
   * @dev This is the function that the Chainlink Keeper nodes call
   * they look for `upkeepNeeded` to return True.
   * the following should be true for this to return true:
   * 1. The time interval has passed between raffle runs.
   * 2. The lottery is open.
   * 3. The contract has ETH.
   * 4. Implicity, your subscription is funded with LINK.
   */

  function checkUpkeep(
    bytes memory /*checkData*/
  ) public view override returns (bool upKeepNeeded, bytes memory /**/) {
    bool isOpen = (s_state == lotteryState.OPEN);
    bool timepassed = ((block.timestamp - s_lastTimeStamp) > i_intervall);
    bool hasplayers = (s_participents.length > 0);
    bool hasbalance = (address(this).balance > 0);
    upKeepNeeded = (isOpen && timepassed && hasbalance && hasplayers);
  }

  function performUpkeep(bytes calldata /*performData*/) external override {
    //request random number
    //do something with it
    //2 transaction process
    (bool upkeepneeded, ) = checkUpkeep("");
    if (!upkeepneeded)
      revert lottery_not_time_yet(
        uint256(s_state),
        s_participents.length,
        address(this).balance
      );
    s_state = lotteryState.CALCULATING;
    uint256 requestId = i_coordinator.requestRandomWords(
      i_gasLane,
      i_subscriptionId,
      REQUEST_CONFIRMATIONS,
      i_callbackGasLimit,
      NUMWORDS
    );
    emit requestedlotteryWinner(requestId);
  }

  function fulfillRandomWords(
    uint256,
    /*requestId*/ uint256[] memory randomWords
  ) internal override {
    uint256 winningIndex = randomWords[0] % (s_participents.length);
    address payable recentWinner = s_participents[winningIndex];
    s_recentWinner = recentWinner;
    s_participents = new address payable[](0);
    s_state = lotteryState.OPEN;
    s_lastTimeStamp = block.timestamp;
    (bool success, ) = recentWinner.call{ value: address(this).balance }("");
    if (!success) revert lottery_transfer_failed();
    emit declaredlotteryWinner(recentWinner);
  }

  /*view , pure functions*/
  function getEntranceFee() public view returns (uint256) {
    return i_entranceFee;
  }

  function getParticipent(uint256 index) public view returns (address) {
    return s_participents[index];
  }

  function getRecentWinner() public view returns (address payable) {
    return s_recentWinner;
  }

  function getLotteryState() public view returns (lotteryState) {
    return s_state;
  }

  function getNumWords() public pure returns (uint256) {
    //pure because constants are in the bytecode
    return NUMWORDS;
  }

  function getNumberOfPlayers() public view returns (uint256) {
    return s_participents.length;
  }

  function getLatestTimeStamp() public view returns (uint256) {
    return s_lastTimeStamp;
  }

  function getNumberOfConfirmations() public pure returns (uint256) {
    return REQUEST_CONFIRMATIONS;
  }

  function getInterval() public view returns (uint256) {
    return i_intervall;
  }
}
