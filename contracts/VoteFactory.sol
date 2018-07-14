pragma solidity ^ 0.4 .24;

import "./Ownable.sol";

contract VoteFactory is  Ownable   {

    modifier voterNotVoted(uint256 _voteId) {
        require(votes[_voteId].voterIsVoted[msg.sender] == false);
        _;
    }

    modifier ownerOfVote(uint256 _voteId) {
        require(voteOwner[_voteId] == msg.sender);
        _;
    }

    modifier voteStateEqually(uint256 _voteId, State _state) {
        require(votes[_voteId].state == _state);
        _;
    }

    event CreateVote(uint256 voteId, string question);
    event StartVote(uint256 voteId);
    event EndVote(uint256 voteId);

    enum State {
        Initial,
        Started,
        Stopped
    }

    struct Vote {
        string question;
        State state;
        string[] answers;

        mapping (uint256 => uint256) voteCount;
        mapping (address => bool) voterIsVoted;
    }

    Vote[] public votes;
    mapping(uint256 => address) public voteOwner;
    uint256 voteId;

    uint256 private createVoteFee = 0.0001 ether;

    constructor() public {
        owner = msg.sender;
    }

    function withdraw() public onlyOwner() {
        owner.transfer(address(this).balance);
    }

    function setCreateVoteFee(uint256 _fee) public onlyOwner() {
        createVoteFee = _fee; 
    }

    function createVote(string _question) public payable {
        require(msg.value >= createVoteFee);
        voteId = votes.push(Vote(_question, State.Initial, new string[](0))) - 1;
        voteOwner[voteId] = msg.sender;
        emit CreateVote(voteId, _question);
    }

    function addAnswer(uint256 _voteId, string _answer) public ownerOfVote(_voteId) voteStateEqually(_voteId, State.Initial) {
        votes[_voteId].answers.push(_answer);
    }

    function startVote(uint256 _voteId) public ownerOfVote(_voteId) voteStateEqually(_voteId, State.Initial) {
        require( votes[_voteId].answers.length >= 2);
        votes[_voteId].state = State.Started;
        emit StartVote(_voteId);
    }

   function voteAnswer(
        uint256 _voteId,
        uint256 _answerOption
    )
        public 
        voterNotVoted(_voteId) voteStateEqually(_voteId, State.Started) {
        
        require(votes[_voteId].answers.length >= _answerOption);
        votes[_voteId].voterIsVoted[msg.sender] = true;
        votes[_voteId].voteCount[_answerOption] += 1; 
    }
    
    function endVote(uint256 _voteId) public ownerOfVote(_voteId) voteStateEqually(_voteId, State.Started) {
       votes[_voteId].state = State.Stopped;
       emit EndVote(_voteId);
    }

    function voteCount(uint256 _voteId) public view returns(uint256[]) {
        uint256[] memory result = new uint256[](votes[_voteId].answers.length);
        for (uint256 i = 0; i < votes[_voteId].answers.length; i ++)
            result[i] = votes[_voteId].voteCount[i];
    return result;
    }

    function isStarted(uint256 _voteId) public view returns(bool) {
        return votes[_voteId].state == State.Started;
    }
 
}