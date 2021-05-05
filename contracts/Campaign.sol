// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.4;

import "./Owned.sol";

contract Campaign is Owned {

    string public name;
    uint public dueDate;
    uint public donationFee;
    uint public prizePoolFee;
    uint public minDonation;
    uint public maxDonation;

    uint public prizePool;

    struct Candidate {
        uint id;
        string name;
        uint voteCount;
        bool isActive;
        address accountAddress;
        address nominator;
    }

    mapping(uint => Candidate) public candidates;

    uint public candidatesCount;

    mapping(address => bool) public addressUsed;

    mapping(address => bool) public voted;

    event CampaignCreated(address _address);

    modifier candidateExists(uint _id) {
        require(_id <= candidatesCount, "Candidate with such id does not exist!");
        _;
    }

    modifier onlyNominator(uint _id) {
        require(msg.sender == candidates[_id].nominator, "You are not the nominator of this candidate!");
        _;
    }

    modifier campaignActive() {
        require(block.timestamp < dueDate, "Campaign is finished!");
        _;
    }

    mapping(address => uint) donated;    

    uint maxVotes;
    uint winners;
    mapping(address => bool) public withdrew;    

    constructor(address _owner, string memory _name, uint256 _dueDate, uint _donationFee, uint _prizePoolFee, uint _minDonation, uint _maxDonation) Owned(_owner) {
        name = _name;
        dueDate = _dueDate;
        setDonationFeeImpl(_donationFee);
        setPrizePoolFeeImpl(_prizePoolFee);
        setDonationLimitsImpl(_minDonation, _maxDonation);
        emit CampaignCreated(address(this));
    }

    // Change campaign parameters
    function setName(string memory _newName) onlyOwner public {
        name = _newName;
    }

    function setDueDate(uint _newDueDate) onlyOwner public {
        dueDate = _newDueDate;
    }

    function setDonationFee(uint _newDonationFee) onlyOwner public {
        setDonationFeeImpl(_newDonationFee);
    }

    function setDonationFeeImpl(uint _newDonationFee) private {
        require(_newDonationFee < 100, "Donation fee should be smaller than 100 (%)");
        donationFee = _newDonationFee;
    }

    function setPrizePoolFee(uint _newPrizePoolFee) onlyOwner public {
        setPrizePoolFeeImpl(_newPrizePoolFee);
    }

    function setPrizePoolFeeImpl(uint _newPrizePoolFee) private {
        require(_newPrizePoolFee < 100, "Prize pool fee should be smaller than 100 (%)");
        prizePoolFee = _newPrizePoolFee;
    }

    function setDonationLimits(uint _minDonation, uint _maxDonation) onlyOwner public {
        setDonationLimitsImpl(_minDonation, _maxDonation);
    }

    function setDonationLimitsImpl(uint _minDonation, uint _maxDonation) private {
        require(_minDonation <= _maxDonation, "Minimal donation should be smaller than maximal donation!");
        minDonation = _minDonation;
        maxDonation = _maxDonation;
    }

    // Create and change candidates data
    function addCandidate(string memory _name, address _address) campaignActive public {
        require(!addressUsed[_address], "This address is already used!");
        candidatesCount++;
        Candidate memory candidate = Candidate(candidatesCount, _name, 0, true, _address, msg.sender);
        saveCandidate(candidatesCount, candidate);
        addressUsed[_address] = true;
    }

    function disableCandidate(uint _id) campaignActive candidateExists(_id) onlyNominator(_id) public {
        Candidate memory candidate = candidates[_id];
        require(candidate.isActive, "Candidate is already inactive!");
        candidate.isActive = false;
        saveCandidate(_id, candidate);
    }

    function enableCandidate(uint _id) campaignActive candidateExists(_id) onlyNominator(_id) public {
        Candidate memory candidate = candidates[_id];
        require(!candidate.isActive, "Candidate is already active!");
        candidate.isActive = true;
        saveCandidate(_id, candidate);
    }

    function changeCandidateName(uint _id, string memory _name) candidateExists(_id) onlyNominator(_id) public {
        Candidate memory candidate = candidates[_id];
        candidate.name = _name;
        saveCandidate(_id, candidate);
    }

    function changeCandidateAddress(uint _id, address _address) candidateExists(_id) onlyNominator(_id) public {
        require(!addressUsed[_address], "This address is already used!");
        Candidate memory candidate = candidates[_id];
        addressUsed[candidate.accountAddress] = false;
        candidate.accountAddress = _address;
        saveCandidate(_id, candidate);
        addressUsed[_address] = true;
    }

    function saveCandidate(uint _id, Candidate memory _candidate) private {
        candidates[_id] = _candidate;
    }

    // Vote for candidates
    function vote(uint _candidateId) campaignActive candidateExists(_candidateId) public {
        require(!voted[msg.sender], "You have already voted!");
        Candidate memory candidate = candidates[_candidateId];
        require(candidate.isActive, "Candidate is not active!");

        voted[msg.sender] = true;
        candidate.voteCount++;
        saveCandidate(_candidateId, candidate);

        if(candidate.voteCount > maxVotes) {
            maxVotes = candidate.voteCount;
            winners = 1;
        } else if (candidate.voteCount == maxVotes) {
            winners++;
        }
    }

    // Donate to candidates
    function donateToCandidate(uint _candidateId) candidateExists(_candidateId) public payable {
        require(msg.value >= minDonation && donated[msg.sender] + msg.value <= maxDonation, "Donation is too small or too large!");
        require(candidates[_candidateId].isActive, "Candidate is inactive!");
        address payable to = payable(candidates[_candidateId].accountAddress);
        donated[msg.sender] = donated[msg.sender] + msg.value;
        uint newSum = msg.value / 100 * (100 - donationFee);
        to.transfer(newSum);
    }

    receive() external payable {
        prizePool = prizePool + msg.value * (100 - prizePoolFee) / 100;
    }

    function withdrawPrizePool(uint candidateId) public payable {
        require(block.timestamp > dueDate, "Elections are not finished yet");
        require(candidatesCount >= 1, "There are no candidates for these elections");
        require(prizePool >= 0, "There is no prize pool for this campaign");

        Candidate memory candidate = candidates[candidateId];
        require(msg.sender == candidate.accountAddress, "You are not this candidate!");
        require(candidate.voteCount == maxVotes, "You are not a winner!");
        require(!withdrew[msg.sender], "You have already withdrawn your funds!");

        uint sum = prizePool / winners;
        address payable to = payable(msg.sender);
        withdrew[msg.sender] = true;
        to.transfer(sum);
    }

}