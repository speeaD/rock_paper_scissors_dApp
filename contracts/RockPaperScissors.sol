// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract RockPaperScissors {
    enum Choice { None, Rock, Paper, Scissors }
    enum GameState { WaitingForPlayer, Completed }
    
    address public owner;
    uint256 public entryFee = 0.01 ether;
    uint256 public reward = 0.001 ether;
    uint256 public houseFunds;
    
    struct Game {
        address player;
        Choice playerChoice;
        Choice contractChoice;
        GameState state;
    }
    
    mapping(address => Game) public games;
    
    event GameStarted(address indexed player);
    event GameCompleted(address indexed player, Choice playerChoice, Choice contractChoice, bool playerWon);
    
    constructor() payable {
        owner = msg.sender;
        houseFunds = msg.value;
    }
    
    // Function to receive Ether
    receive() external payable {
        houseFunds += msg.value;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function");
        _;
    }
    
    function deposit() external payable onlyOwner {
        houseFunds += msg.value;
    }
    
    function withdraw(uint256 amount) external onlyOwner {
        require(amount <= houseFunds, "Insufficient funds");
        houseFunds -= amount;
        (bool success, ) = owner.call{value: amount}("");
        require(success, "Transfer failed");
    }
    
    function play(uint8 _choice) external payable {
        require(_choice >= 1 && _choice <= 3, "Invalid choice");
        require(msg.value == entryFee, "Please send exactly 0.01 ether to play");
        require(games[msg.sender].state != GameState.WaitingForPlayer, "You already have a game in progress");
        
        // Convert choice from uint8 to enum Choice
        Choice playerChoice = Choice(_choice);
        
        // Generate contract's choice (1 for Rock, 2 for Paper, 3 for Scissors)
        uint8 contractChoiceNum = uint8(uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, msg.sender))) % 3) + 1;
        Choice contractChoice = Choice(contractChoiceNum);
        
        // Create a new game
        games[msg.sender] = Game({
            player: msg.sender,
            playerChoice: playerChoice,
            contractChoice: contractChoice,
            state: GameState.Completed
        });
        
        // Determine if player won
        bool playerWon = isPlayerWinner(playerChoice, contractChoice);
        
        // Process result
        if (playerWon) {
            require(houseFunds >= reward, "Contract has insufficient funds for reward");
            houseFunds -= reward;
            (bool success, ) = msg.sender.call{value: reward}("");
            require(success, "Reward transfer failed");
        } else {
            houseFunds += msg.value;
        }
        
        emit GameCompleted(msg.sender, playerChoice, contractChoice, playerWon);
    }
    
    function isPlayerWinner(Choice playerChoice, Choice contractChoice) internal pure returns (bool) {
        if (playerChoice == contractChoice) {
            return false; // Tie counts as a loss
        }
        
        if (playerChoice == Choice.Rock && contractChoice == Choice.Scissors) {
            return true;
        }
        
        if (playerChoice == Choice.Paper && contractChoice == Choice.Rock) {
            return true;
        }
        
        if (playerChoice == Choice.Scissors && contractChoice == Choice.Paper) {
            return true;
        }
        
        return false;
    }
    
    function getGameStatus() external view returns (Choice, Choice, bool) {
        Game memory game = games[msg.sender];
        require(game.state == GameState.Completed, "No completed game found");
        
        bool playerWon = isPlayerWinner(game.playerChoice, game.contractChoice);
        return (game.playerChoice, game.contractChoice, playerWon);
    }
    
    // Function to check contract balance
    function getContractBalance() external view onlyOwner returns (uint256) {
        return address(this).balance;
    }
}