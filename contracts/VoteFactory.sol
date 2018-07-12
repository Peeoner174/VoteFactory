pragma solidity ^ 0.4 .24;

import "./Ownable.sol";

contract VoteFactory is  Ownable   {

    modifier voterNotVoted(uint _voteId) {
        require(votes[_voteId].voterIsVoted[owner] == false);
        _;
    }

    modifier ownerOfVote(uint _voteId) {
        require(voteOwner[_voteId] == msg.sender);
        _;
    }

    modifier stateEqually(uint _voteId, State _state) {
        require(votes[_voteId].state == _state);
        _;
    }

    event CreateVote(uint voteId, string question);
    event StartVote(uint voteId);
    event EndVote(uint voteId);

    enum State {
        Initial,
        Started,
        Stopped
    }

    struct Vote {
        string question;
        State state;
        string[] answers;

        mapping (uint => uint) voteCount;
        mapping (address => bool) voterIsVoted;
    }

    Vote[] public votes;
    mapping(uint256 => address) public voteOwner;

    constructor() public {
        owner = msg.sender;
    }

    function createVote(string _question) public {
        uint voteId = votes.push(Vote(_question, State.Initial, new string[](0))) - 1;
        voteOwner[voteId] = msg.sender;
        emit CreateVote(voteId, _question);
    }

    function addAnswer(uint256 _voteId, string _answer) public  ownerOfVote(_voteId) stateEqually(_voteId, State.Initial) {
        votes[_voteId].answers.push(_answer);
    }

    function startVote(uint _voteId) public ownerOfVote(_voteId) stateEqually(_voteId, State.Initial) {
        require( votes[_voteId].answers.length >= 2);
        votes[_voteId].state = State.Started;
        emit StartVote(_voteId);
    }

   function voteAnswer(uint _voteId, uint _answerOption) public voterNotVoted(_voteId) stateEqually(_voteId, State.Started)  {
        votes[_voteId].voterIsVoted[owner] = true;
        votes[_voteId].voteCount[_answerOption] += 1; 
    }
    
    function endVote(uint _voteId) public {
       votes[_voteId].state = State.Stopped;
       emit EndVote(_voteId);
    }

    function voteCount(uint _voteId) public view returns(uint[]){
        uint[] memory result = new uint[](votes[_voteId].answers.length);
        for (uint i = 0; i < votes[_voteId].answers.length; i ++)
            result[i] = votes[_voteId].voteCount[i];
    return result;
    }

    function isStopped(uint _voteId) public view returns(bool) {
        return votes[_voteId].state == State.Stopped;
    }
 
}