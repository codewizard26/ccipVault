//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {TokenPool} from "../lib/ccip/contracts/src/v0.8/ccip/pools/TokenPool.sol";
import {Pool} from "../lib/ccip/contracts/src/v0.8/ccip/libraries/Pool.sol";
import {IERC20} from "../lib/ccip/contracts/src/v0.8/vendor/openzeppelin-solidity/v4.8.3/contracts/token/ERC20/IERC20.sol";
import {IRebaseToken} from "./interfaces/IRebaseToken.sol";

contract RebaseTokenPool is TokenPool {
    // Staking state variables
    mapping(address => uint256) private s_stakedBalances;
    mapping(address => uint256) private s_stakingTimestamps;
    uint256 private s_totalStaked;
    // Events
    event TokensStaked(address indexed user, uint256 amount, uint256 timestamp);
    event TokensUnstaked(
        address indexed user,
        uint256 amount,
        uint256 timestamp
    );

    constructor(
        IERC20 _token,
        address[] memory _allowlist,
        address _rnmProxy,
        address _router
    ) TokenPool(_token, _allowlist, _rnmProxy, _router) {}

    function lockOrBurn(
        Pool.LockOrBurnInV1 calldata lockOrBurnIn
    ) external returns (Pool.LockOrBurnOutV1 memory lockOrBurnOut) {
        _validateLockOrBurn(lockOrBurnIn);

        uint256 userInterestRate = IRebaseToken(address(i_token))
            .getUserInterestRate(lockOrBurnIn.originalSender);
        IRebaseToken(address(i_token)).burn(address(this), lockOrBurnIn.amount);
        lockOrBurnOut = Pool.LockOrBurnOutV1({
            destTokenAddress: getRemoteToken(lockOrBurnIn.remoteChainSelector),
            destPoolData: abi.encode(userInterestRate)
        });
    }

    function releaseOrMint(
        Pool.ReleaseOrMintInV1 calldata releaseOrMintIn
    ) external returns (Pool.ReleaseOrMintOutV1 memory releaseOrMintOut) {
        _validateReleaseOrMint(releaseOrMintIn);
        uint256 userInterestRate = abi.decode(
            releaseOrMintIn.sourcePoolData,
            (uint256)
        );

        IRebaseToken(address(i_token)).mint(
            releaseOrMintIn.receiver,
            releaseOrMintIn.amount,
            userInterestRate
        );

        return
            Pool.ReleaseOrMintOutV1({
                destinationAmount: releaseOrMintIn.amount
            });
    }

    // Staking Functions

    /**
     * @notice Stake tokens to earn voting power
     * @param amount The amount of tokens to stake
     */
    function stake(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(
            IERC20(i_token).balanceOf(msg.sender) >= amount,
            "Insufficient token balance"
        );
        require(
            IERC20(i_token).allowance(msg.sender, address(this)) >= amount,
            "Insufficient allowance"
        );

        // Transfer tokens from user to this contract
        IERC20(i_token).transferFrom(msg.sender, address(this), amount);

        // Update staking balances
        s_stakedBalances[msg.sender] += amount;
        s_stakingTimestamps[msg.sender] = block.timestamp;
        s_totalStaked += amount;

        emit TokensStaked(msg.sender, amount, block.timestamp);
    }

    /**
     * @notice Unstake tokens and lose voting power
     * @param amount The amount of tokens to unstake
     */
    function unstake(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(
            s_stakedBalances[msg.sender] >= amount,
            "Insufficient staked balance"
        );

        // Update staking balances
        s_stakedBalances[msg.sender] -= amount;
        s_totalStaked -= amount;

        // Transfer tokens back to user
        IERC20(i_token).transfer(msg.sender, amount);

        emit TokensUnstaked(msg.sender, amount, block.timestamp);
    }

    /**
     * @notice Get the staked balance of a user
     * @param user The user address
     * @return The staked balance
     */
    function getStakedBalance(address user) external view returns (uint256) {
        return s_stakedBalances[user];
    }

    /**
     * @notice Get the voting power of a user (1:1 with staked tokens)
     * @param user The user address
     * @return The voting power
     */
    function getVotingPower(address user) external view returns (uint256) {
        return s_stakedBalances[user];
    }

    /**
     * @notice Get the total amount of tokens staked across all users
     * @return The total staked amount
     */
    function getTotalStaked() external view returns (uint256) {
        return s_totalStaked;
    }


    /**
     * @notice Get the staking timestamp for a user
     * @param user The user address
     * @return The staking timestamp
     */
    function getStakingTimestamp(address user) external view returns (uint256) {
        return s_stakingTimestamps[user];
    }
}
