// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.4;

import "./Owned.sol";
import "./Campaign.sol";

contract CampaignManager is Owned {

    uint public fee;
    uint public campaignsCount;
    Campaign[] public campaigns;

    constructor(uint _fee) Owned(msg.sender) {
        fee = _fee;
    }

    function setFee(uint _fee) onlyOwner public {
        fee = _fee;
    }

    function createCampaign(string memory _name, uint256 _dueDate, uint _donationFee, uint _prizePoolFee, uint _minDonation, uint _maxDonation) public payable {
        require(msg.value >= fee, "You should send the required");
        Campaign campaign = new Campaign(msg.sender, _name, _dueDate, _donationFee, _prizePoolFee, _minDonation, _maxDonation);
        campaigns.push(campaign);
        campaignsCount++;
    }

    function withdraw(address _address, uint _sum) onlyOwner payable public {
        uint balance = address(this).balance;
        require(_sum <= balance, "Insufficient funds!");
        require(balance > 0, "Nothing to withdraw!");
        address payable to = payable(_address);

        to.transfer(_sum);
    }
}