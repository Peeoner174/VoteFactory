const BigNumber = web3.BigNumber;
var ethUtil = require('ethereumjs-util')
var Tx = require('ethereumjs-tx');
const expect = require('chai').expect;
const should = require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bignumber')(web3.BigNumber))
    .should();

import expectThrow from './helpers/expectThrow';

var VoteFactory = artifacts.require("./VoteFactory.sol");

contract('VoteFactory', function(accounts) {
    var voteFactory;

    const owner = accounts[0]; //Создатель контракта
    const creator = accounts[1]; //Условный создатель единицы голосования
    const user = accounts[2];

    const question_0 = "Question 0";
    const answer_opt_1 = "Answer 0";
    const answer_optId_1 = 0;
    const answer_opt_2 = "Answer 1";
    const answer_optId_2 = 1;
    const answer_opt_3 = "Answer 2";
    const answer_optId_3 = 2;
    const vote_id_1 = 0;
    const vote_id_2 = 1;

    beforeEach('setup contract for each test', async function () {
        voteFactory = await VoteFactory.new({from: owner});
    });

    describe('vote creation', function() {

        it('every user should be able to create a vote', async () => {
            await voteFactory.createVote(question_0, {from: creator, value: web3.toWei(0.05, "ether")});
            await voteFactory.createVote(question_0, {from: owner, value: web3.toWei(0.05, "ether")});
        });

        it('answer should be able to added only creator this vote', async () => {
            await voteFactory.createVote(question_0, {from: creator, value: web3.toWei(0.05, "ether")});

            await voteFactory.addAnswer(vote_id_1, answer_opt_1, {from: creator});
            await expectThrow(voteFactory.addAnswer(vote_id_1, answer_opt_2, {from: user}));
            await expectThrow(voteFactory.addAnswer(vote_id_1, answer_opt_1, {from: owner})); 
        });

/*         it('do not add answer in not existing vote', async() => {
            await voteFactory.createVote(question_0, {from: creator});
            
            await expectThrow(voteFactory.addAnswer(vote_id_2, answer_opt_1, {from: creator}));
        }); */

        it('a creater should be able to started a vote', async () => {

            await voteFactory.createVote(question_0, {from: creator, value: web3.toWei(0.05, "ether")});
            await voteFactory.addAnswer(vote_id_1, answer_opt_1, {from: creator});
            await voteFactory.addAnswer(vote_id_1, answer_opt_2, {from: creator});

            await expectThrow(voteFactory.startVote(vote_id_1, {from: owner}));
            await expectThrow(voteFactory.startVote(vote_id_1, {from: user}));
            await voteFactory.startVote(vote_id_1, {from: creator});

            var state = await voteFactory.isStarted(vote_id_1);
            state.should.be.equal(true);  
            await expectThrow(voteFactory.startVote(vote_id_1, {from: creator}));
        });

        it('do not start vote if this vote have only one answer', async () => {
            await voteFactory.createVote(question_0, {from: creator, value: web3.toWei(0.05, "ether")});
            await voteFactory.addAnswer(vote_id_1, answer_opt_1, {from: creator});
            
            await expectThrow(voteFactory.startVote(vote_id_1, {from: creator}));
        });

/*         it('do not start not existing vote ', async () => {
            await voteFactory.createVote(question_0, {from: creator});
            await voteFactory.addAnswer(vote_id_1, answer_opt_1, {from: creator});
            await voteFactory.addAnswer(vote_id_1, answer_opt_2, {from: creator});

            await expectThrow(voteFactory.startVote(vote_id_2, {from: creator}));
        }); */
        
    });
    
    describe('voting', function() {
        it('every user should be able to vote only one time in a ballot', async () => {
            await voteFactory.createVote(question_0, {from: creator, value: web3.toWei(0.05, "ether")});
            await voteFactory.addAnswer(vote_id_1, answer_opt_1, {from: creator});
            await voteFactory.addAnswer(vote_id_1, answer_opt_2, {from: creator});
            await voteFactory.startVote(vote_id_1, {from: creator});
            
            await voteFactory.voteAnswer(vote_id_1, answer_optId_1, {from: creator});
            await voteFactory.voteAnswer(vote_id_1, answer_optId_2, {from: owner});
            await voteFactory.voteAnswer(vote_id_1, answer_optId_2, {from: user}); 
            
            await expectThrow(voteFactory.voteAnswer(vote_id_1,  answer_optId_2, {from: creator}));
            await expectThrow(voteFactory.voteAnswer(vote_id_1,  answer_optId_2, {from: owner}));
            await expectThrow(voteFactory.voteAnswer(vote_id_1,  answer_optId_2, {from: user}));   
        });

        it('user should not be able to vote in a not exist ballot', async() => {
            await voteFactory.createVote(question_0, {from: creator, value: web3.toWei(0.05, "ether")});
            await voteFactory.addAnswer(vote_id_1, answer_opt_1, {from: creator});
            await voteFactory.addAnswer(vote_id_1, answer_opt_2, {from: creator});
            await voteFactory.startVote(vote_id_1, {from: creator});

            await expectThrow(voteFactory.voteAnswer(vote_id_2,  answer_optId_2, {from: creator}));
        });

/*         it('user should not be able to select a not exist answer option', async() => {
            await voteFactory.createVote(question_0, {from: creator});
            await voteFactory.addAnswer(vote_id_1, answer_opt_1, {from: creator});
            await voteFactory.addAnswer(vote_id_1, answer_opt_2, {from: creator});
            await voteFactory.startVote(vote_id_1, {from: creator});

           // await expectThrow(voteFactory.voteAnswer(vote_id_1,  answer_optId_3, {from: creator}));
        }); */
    });

    describe('returns voters data', function() { 
        it('every user should be able to get result of a vote', async function() {
            await voteFactory.createVote(question_0, {from: creator, value: web3.toWei(0.05, "ether")});
            await voteFactory.addAnswer(vote_id_1, answer_opt_1, {from: creator});
            await voteFactory.addAnswer(vote_id_1, answer_opt_2, {from: creator});
            await voteFactory.startVote(vote_id_1, {from: creator});
            await voteFactory.voteAnswer(vote_id_1, answer_optId_1, {from: creator});
            await voteFactory.voteAnswer(vote_id_1, answer_optId_2, {from: owner});
            await voteFactory.voteAnswer(vote_id_1, answer_optId_2, {from: user}); 
            
            var voteResult; 
            voteResult = await voteFactory.results(vote_id_1, {from: creator});
            console.log(voteResult);
            voteResult = await voteFactory.results(vote_id_1, {from: owner});
            console.log(voteResult);
            voteResult = await voteFactory.results(vote_id_1, {from: user});
            console.log(voteResult);
        });

/*         it('user should not be able to get result of not exist ballot', async() => {
            await voteFactory.createVote(question_0, {from: creator});
            await voteFactory.addAnswer(vote_id_1, answer_opt_1, {from: creator});
            await voteFactory.addAnswer(vote_id_1, answer_opt_2, {from: creator});
            await voteFactory.startVote(vote_id_1, {from: creator});
            await voteFactory.voteAnswer(vote_id_1, answer_optId_1, {from: creator});
            await voteFactory.voteAnswer(vote_id_1, answer_optId_2, {from: owner});
            await voteFactory.voteAnswer(vote_id_1, answer_optId_2, {from: user}); 
            
            await expectThrow(voteFactory.voteCount(vote_id_2, {from: owner}));
        }); */
    }); 

    describe('stop vote', function() { 
        it('only creator should be able to stop a vote', async () => {
            await voteFactory.createVote(question_0, {from: creator, value: web3.toWei(0.05, "ether")});
            await voteFactory.addAnswer(vote_id_1, answer_opt_1, {from: creator});
            await voteFactory.addAnswer(vote_id_1, answer_opt_2, {from: creator});
            await voteFactory.startVote(vote_id_1, {from: creator});
            await voteFactory.voteAnswer(vote_id_1, answer_optId_1, {from: creator});
            await voteFactory.voteAnswer(vote_id_1, answer_optId_2, {from: owner});

            await voteFactory.EndVote(vote_id_1, {from: creator});
           // await expectThrow(voteFactory.EndVote(vote_id_1, {from: user}));
           // await expectThrow(voteFactory.EndVote(vote_id_1, {from: owner}));
        });

/*         it('user should not be able to end vote of not exist ballot', async() => {
            await voteFactory.createVote(question_0, {from: creator});
            await voteFactory.addAnswer(vote_id_1, answer_opt_1, {from: creator});
            await voteFactory.addAnswer(vote_id_1, answer_opt_2, {from: creator});
            await voteFactory.startVote(vote_id_1, {from: creator});
            await voteFactory.voteAnswer(vote_id_1, answer_optId_1, {from: creator});
            await voteFactory.voteAnswer(vote_id_1, answer_optId_2, {from: owner});
            await voteFactory.voteAnswer(vote_id_1, answer_optId_2, {from: user}); 
            
            await voteFactory.EndVote(vote_id_2, {from: owner});
        }); */
    });

 /*    describe('attacks', function() {
        it('short adress attack', async function () {
            var from = 0x01d9D1Ac7ebd965dBf0cbBdc5Ef5093DedA7f602;
            var from_bytes = "01d9D1Ac7ebd965dBf0cbBdc5Ef5093DedA7f602";
            var to = 0x01d9D1Ac7ebd965dBf0cbBdc5Ef5093DedA7f602;
            var to_bytes = "01d9D1Ac7ebd965dBf0cbBdc5Ef5093DedA7f602";
            var value = 100;
            var value_bytes = "8fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
            var feeSmt = 2;
            var feeSmt_bytes = "7000000000000000000000000000000000000000000000000000000000000001";
            var nonce = 0;
            var nonce_bytes = "0000000000000000000000000000000000000000000000000000000000000000";
            var msgBuffer = ethUtil.sha3("0x" + from_bytes + to_bytes + value_bytes + feeSmt_bytes + nonce_bytes)
            var messagetoSign = ethUtil.bufferToHex(msgBuffer)
            var messagetoSend = ethUtil.bufferToHex(ethUtil.hashPersonalMessage(msgBuffer)) 

            const unlockedAccount = accounts[0]
            var privkey = new Buffer('28780b50f222df8539903fc88f66cb02a602d9c1b8fc84e0e297cf51f7ca5911', 'hex');

            var vrs = ethUtil.ecsign(msgBuffer, privkey);
            let v = vrs.v.toString()
            let r = ethUtil.bufferToHex(vrs.r)
            let s = ethUtil.bufferToHex(vrs.s)

            console.log(' msg2sign: ' + messagetoSign)        
            console.log(' msg2send: ' + messagetoSend)    
            console.log()
            console.log(v)
            console.log(r)
            console.log(s)
            console.log(ethUtil.publicToAddress(ethUtil.ecrecover(msgBuffer, v, r, s)).toString('hex'))    
        
            const recoveredAddress = await this.contract.transferProxy(from, to, value, feeSmt, v, r, s)
            recoveredAddress.should.be.equal(unlockedAccount,'The recovered address should match the signing address')
        });
    }); */

});
