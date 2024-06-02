//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

// Useful for debugging. Remove when deploying to a live network.
import "hardhat/console.sol";

/**
 * A smart contract that allows changing a state variable of the contract and tracking the changes
 * It also allows the owner to withdraw the Ether in the contract
 * @author BuidlGuidl
 */
contract YourContract {
    address public v = 0x5FbDB2315678afecb367f032d93F642f64180aa3;
    // State Variables
    address public owner;
    string public greeting = "Building Unstoppable Apps!!!";
    bool public premium = false;
    uint256 public totalCounter = 69;
    mapping(address => uint) public userGreetingCounter;
    mapping(address => bool) public addressList;

    function setNewOwner(address _newOwner) public isOwner {
        require(msg.sender == owner, "Not the Owner");
        owner = _newOwner;
    }

    // Events: a way to emit log statements from smart contract that can be listened to by external parties
    event GreetingChange(
        address indexed greetingSetter,
        string newGreeting,
        bool premium,
        uint256 value
    );

    // Constructor: Called once on contract deployment
    // Check packages/hardhat/deploy/00_deploy_your_contract.ts
    constructor(address _owner) {
        owner = _owner;
    }

    // Modifier: used to define a set of rules that must be met before or after a function is executed
    // Check the withdraw() function
    modifier isOwner() {
        // msg.sender: predefined variable that represents address of the account that called the current function
        require(msg.sender == owner, "Not the Owner");
        _;
    }

    /**
     * Function that allows anyone to change the state variable "greeting" of the contract and increase the counters
     *
     * @param _newGreeting (string memory) - new greeting to save on the contract
     */
    function setGreeting(string memory _newGreeting) public payable {
        // Print data to the hardhat chain console. Remove when deploying to a live network.
        console.log(
            "Setting new greeting '%s' from %s",
            _newGreeting,
            msg.sender
        );

        // Change state variables
        greeting = _newGreeting;
        totalCounter += 1;
        userGreetingCounter[msg.sender] += 1;

        // msg.value: built-in global variable that represents the amount of ether sent with the transaction
        if (msg.value > 0) {
            premium = true;
        } else {
            premium = false;
        }

        // emit: keyword used to trigger an event
        emit GreetingChange(msg.sender, _newGreeting, msg.value > 0, msg.value);
    }

    /**
     * Function that allows the owner to withdraw all the Ether in the contract
     * The function can only be called by the owner of the contract as defined by the isOwner modifier
     */
    function withdraw() public isOwner {
        (bool success, ) = owner.call{ value: address(this).balance }("");
        require(success, "Failed to send Ether");
    }

    /**
     * Function that allows the contract to receive ETH
     */
    receive() external payable {}

    /**
     * Function to add an address to the list
     * @param _address The address to be added
     */
    function addAddress(address _address) public {
        addressList[_address] = true;
    }

    /**
     * Function to remove an address from the list
     * @param _address The address to be removed
     */
    function removeAddress(address _address) public {
        addressList[_address] = false;
    }

    /**
     * Function to check if an address is present in the list
     * @param _address The address to check
     * @return bool True if the address is present, false otherwise
     */
    function isAddressPresent(address _address) public view returns(bool) {
        return addressList[_address];
    }
}