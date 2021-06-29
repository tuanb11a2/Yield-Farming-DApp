const { assert } = require('chai')

const DappToken = artifacts.require('DappToken')
const DaiToken = artifacts.require('DaiToken')
const TokenFarm = artifacts.require('TokenFarm')

require('chai').use(require('chai-as-promised')).should()

function tokens(n){
    return web3.utils.toWei(n, 'ether');
}

contract('TokenFarm',([owner, investor]) => {
    //Test code
    let daiToken, dappToken, tokenFarm

    before (async () => {
        daiToken = await DaiToken.new()
        dappToken = await DappToken.new()
        tokenFarm = await TokenFarm.new(dappToken.address, daiToken.address)
    
        ////Transfer all DappToken to TokenFarm - act like pool to issues reward
        await dappToken.transfer(tokenFarm.address, tokens('1000000'))

        //Transfer 100 Mock DAI tokens to investor
        await daiToken.transfer(investor, tokens('100'), { from: owner })
    })
    
    //Mock DAI token
    describe('Mock DAI deployment', async() => {
        it('has a name', async () => {
            const name = await daiToken.name()
            assert.equal(name, 'Mock DAI Token')
        })
    })

    //Dapp token
    describe('Dapp Token deployment', async() => {
        it('has a name', async () => {
            const name = await dappToken.name()
            assert.equal(name, 'DApp Token')
        })
    })

    //Token Farm
    describe('Token Farm deployment', async() => {
        it('has a name', async () => {
            const name = await tokenFarm.name()
            assert.equal(name, 'Dapp Token Farm')
        })

        it('contract has tokens', async () => {
            let balance = await dappToken.balanceOf(tokenFarm.address)
            assert.equal(balance.toString(),tokens('1000000'))
        })
    })

    //Deposit token
    describe('Farming Tokens', async() => {
        it('rewards investors for staking mDai tokens', async () => {
            let result

            //Check balance first
            result = await daiToken.balanceOf(investor)
            assert.equal(result.toString(), tokens('100'), 'investor Mock DAI wallet balance correct befor staking')
        
            //Stake Mock DAI Tokens
            await daiToken.approve(tokenFarm.address, tokens('100'), { from: investor })
            await tokenFarm.stakeTokens(tokens('100'), {from: investor})

            //Check staking result
            result = await daiToken.balanceOf(investor)
            assert.equal(result.toString(), tokens('0'), 'investor Mock DAI wallet balance correct after staking')

            result = await daiToken.balanceOf(tokenFarm.address)
            assert.equal(result.toString(), tokens('100'), 'Token Farm Mock DAI balance correct after staking')

            result = await tokenFarm.stakingBalance(investor)
            assert.equal(result.toString(), tokens('100'), 'investor staking balance correct after staking')
        
            result = await tokenFarm.isStaking(investor)
            assert.equal(result.toString(), 'true' , 'investor staking status correct after staking')
        
            //Issue tokens
            await tokenFarm.issueTokens({from: owner})

            //Check balances after issuance
            result = await dappToken.balanceOf(investor)
            assert.equal(result.toString(), tokens('100'), 'investor DApp Token wallet balance after issues rewards')
        
            //Ensure that only owner can issue tokens
            await tokenFarm.issueTokens({ from : investor}).should.be.rejected;
        
            //Unstake tokens
            await tokenFarm.unstakeTokens({from: investor})

            //Check results after unstaking
            result = await daiToken.balanceOf(investor)
            assert.equal(result.toString(), tokens('100'), 'investor Mock DAI wallet balance correct after staking')

            result = await daiToken.balanceOf(tokenFarm.address)
            assert.equal(result.toString(), tokens('0'), 'Token Farm Mock DAI balance correct after staking')

            result = await tokenFarm.stakingBalance(investor)
            assert.equal(result.toString(), tokens('0'), 'investor staking balance correct after staking')

            result = await tokenFarm.isStaking(investor)
            assert.equal(result.toString(), 'false', 'investor staking status correct after staking')
        })
    })

})