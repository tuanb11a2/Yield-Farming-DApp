pragma solidity ^0.5.0;

import "./DappToken.sol";
import "./DaiToken.sol";

contract TokenFarm{
    string public name = "Dapp Token Farm";
    address public owner;
    DappToken public dappToken;
    DaiToken public daiToken;
    
    address[] public stakers;
    mapping(address => uint) public stakingBalance;
    mapping(address => bool) public hasStaked;
    mapping(address => bool) public isStaking;

    constructor(DappToken _dappToken, DaiToken _daiToken) public {
        dappToken = _dappToken;
        daiToken = _daiToken;
        owner = msg.sender;
    }

    //Stake DAI Tokens - transfer DAI Tokens to the TokenFarm contracts
    function stakeTokens(uint _amount) public {
        //Require amout greater than 0
        require(_amount > 0, "amout cannot be 0");
        
        //Transfer from investor
        daiToken.transferFrom(msg.sender, address(this), _amount);

        //Update staking balance
        stakingBalance[msg.sender] = stakingBalance[msg.sender] + _amount;

        //Add new stakers if haven't deposited before
        if(!hasStaked[msg.sender]){
            stakers.push(msg.sender);
        }

        //Update stakers status
        isStaking[msg.sender] = true;
        hasStaked[msg.sender] = true;
    }

    //Un-stake DAI Tokens (Withdraw)
    function unstakeTokens() public {
        // Fetch staking balance
        uint balance = stakingBalance[msg.sender];

        // Require amount greater than 0
        require(balance > 0, "staking balance cannot be 0");

        // Transfer Mock Dai tokens to this contract for staking
        daiToken.transfer(msg.sender, balance);

        // Reset staking balance
        stakingBalance[msg.sender] = 0;

        // Update staking status
        isStaking[msg.sender] = false;
    }

    //Issues Tokens as rewards
    function issueTokens() public {
        // Only owner can call this function
        require(msg.sender == owner, "caller must be the owner");
        uint total = 0;

        // Issue tokens to all stakers
        for (uint i=0; i<stakers.length; i++) {
            address recipient = stakers[i];
            
            uint balance = stakingBalance[recipient];
            if(balance > 0) {
                dappToken.transfer(recipient, balance);
            }
        }
    }
}