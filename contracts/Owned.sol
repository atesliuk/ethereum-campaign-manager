pragma solidity ^0.8.4;

contract Owned {

    address public owner;

    constructor(address _owner) {
        owner = _owner;
    }

    modifier onlyOwner() {
        require(isOwner(), "You are not allowed!");
        _;
    }

    function isOwner() public view returns(bool) {
        return msg.sender == owner;
    }

}