"use client";

import React, { useState, useEffect, ReactNode } from "react";
import { useAccount } from "wagmi";
import { ethers, Contract, ContractInterface } from "ethers";
import { useEthersSigner } from "@/utils/signer";

// Game types
export type GameOption = "rock" | "paper" | "scissors";

interface RockPaperScissorsContextProps {
  userChoice: GameOption | null;
  computerChoice: GameOption | null;
  result: string | null;
  score: number;
  isLoading: boolean;
  txHash: string | null;
  entryFee: string | null;
  gameInProgress: boolean;
  handleUserChoice: (choice: GameOption) => Promise<void>;
  resetGame: () => void;
  checkGameStatus: () => Promise<void>;
  resetOnChainGame: () => Promise<void>;
}

interface RockPaperScissorsProviderProps {
  children: ReactNode;
  contractAddress: string;
  contractAbi: ContractInterface;
}

// Convert game options to contract values
const optionToContract: Record<GameOption, number> = {
  rock: 1, // Choice.Rock
  paper: 2, // Choice.Paper
  scissors: 3, // Choice.Scissors
};

// Convert contract values back to game options
const contractToOption: Record<number, GameOption> = {
  1: "rock", // Choice.Rock
  2: "paper", // Choice.Paper
  3: "scissors", // Choice.Scissors
};

// Context initialization
const RockPaperScissorsContext = React.createContext<RockPaperScissorsContextProps | undefined>(undefined);

const RockPaperScissorsProvider: React.FC<RockPaperScissorsProviderProps> = ({ 
  children, 
  contractAddress, 
  contractAbi 
}) => {
  const { address, chain } = useAccount();
  const [activeChain, setActiveChainId] = useState<number | undefined>(chain?.id);
  
  // Game state
  const [score, setScore] = useState<number>(0);
  const [userChoice, setUserChoice] = useState<GameOption | null>(null);
  const [computerChoice, setComputerChoice] = useState<GameOption | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [entryFee, setEntryFee] = useState<string | null>(null);
  const [gameInProgress, setGameInProgress] = useState<boolean>(false);

  // Update the active chain when it changes
  useEffect(() => {
    setActiveChainId(chain?.id);
  }, [chain?.id]);

  // Get signer from custom hook
  const signer = useEthersSigner({ chainId: activeChain });

  // Get contract instance
  const getContractInstance = React.useCallback(async (): Promise<Contract | undefined> => {
    try {
      if (!signer) return undefined;
      
      const contractInstance = new ethers.Contract(
        contractAddress,
        contractAbi,
        signer
      );

      return contractInstance;
    } catch (e) {
      console.log("Error in getting contract instance:", e);
      return undefined;
    }
  }, [signer, contractAddress, contractAbi]);

  // Function to get entry fee
  const getEntryFee = React.useCallback(async () => {
    const contractInstance = await getContractInstance();
    if (!contractInstance) return;

    try {
      const fee = await contractInstance.entryFee();
      setEntryFee(fee.toString());
    } catch (error) {
      console.error("Error fetching entry fee:", error);
    }
  }, [getContractInstance]);

  // Check if a game is already in progress
  const checkGameInProgress = React.useCallback(async () => {
    if (!address) return false;
    
    const contractInstance = await getContractInstance();
    if (!contractInstance) return false;

    try {
      const inProgress = await contractInstance.hasActiveGame(address);
      setGameInProgress(inProgress);
      return inProgress;
    } catch (error) {
      console.error("Error checking game status:", error);
      return false;
    }
  }, [getContractInstance, address]);

  // Function to check game status
  const checkGameStatus = async () => {
    if (!address) return;
    
    setIsLoading(true);
    const contractInstance = await getContractInstance();
    if (!contractInstance) {
      setIsLoading(false);
      return;
    }

    try {
      // First check if game is in progress
      const hasActiveGame = await checkGameInProgress();
      
      if (hasActiveGame) {
        // If there's an active game, get its status
        const status = await contractInstance.getGameStatus();
        if (status && status.length === 3) {
          processGameResult([...status] as [number, number, boolean]);
        } else {
          console.error("Invalid game status format:", status);
          resetGame();
        }
      } else {
        setGameInProgress(false);
        resetGame();
      }
    } catch (error) {
      console.error("Error getting game status:", error);
      resetGame();
    } finally {
      setIsLoading(false);
    }
  };

  // Function to reset an active game on the contract
  const resetOnChainGame = async () => {
    const contractInstance = await getContractInstance();
    if (!contractInstance) return;

    setIsLoading(true);
    try {
      const tx = await contractInstance.cancelGame();
      await tx.wait();
      
      setGameInProgress(false);
      resetGame();
    } catch (error) {
      console.error("Error resetting game on chain:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to play the game
  const playGameOnChain = async (choice: number) => {
    const contractInstance = await getContractInstance();
    if (!contractInstance) {
      console.error("Could not connect to contract");
      setIsLoading(false);
      return;
    }

    try {
      // Check if there's already a game in progress
      const hasActiveGame = await checkGameInProgress();
      
      if (hasActiveGame) {
        console.log("Game already in progress, getting current status");
        await checkGameStatus();
        return;
      }
      
      const fee = entryFee ? ethers.BigNumber.from(entryFee) : ethers.BigNumber.from(0);
      const tx = await contractInstance.play(choice, {
        value: fee,
        from: address
      });
      
      setTxHash(tx.hash);
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      console.log("Game played successfully:", receipt);
      
      // Get game status after transaction is confirmed
      await checkGameStatus();
    } catch (error) {
      console.error("Error playing game:", error);
      resetGame();
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize contract data when signer is available
  useEffect(() => {
    if (!signer || !address) return;
    
    const initializeContract = async () => {
      await getEntryFee();
      await checkGameInProgress();
    };
    
    initializeContract();
  }, [getEntryFee, checkGameInProgress, signer, address]);

  // Load score from localStorage on component mount
  useEffect(() => {
    const savedScore = localStorage.getItem("score");
    if (savedScore !== null) {
      setScore(parseInt(savedScore));
    } else {
      localStorage.setItem("score", "0");
    }
  }, []);

  const updateScore = (isWin: boolean) => {
    let newScore = score;
    if (isWin) {
      newScore += 1;
    } else if (score > 0) {
      newScore -= 1;
    }
    setScore(newScore);
    localStorage.setItem("score", newScore.toString());
  };

  const processGameResult = (status: [number, number, boolean]) => {
    try {
      const [playerChoiceNum, contractChoiceNum, playerWon] = status;

      // Convert contract choices back to UI options
      const playerChoice = Number(playerChoiceNum);
      if (playerChoice in contractToOption) {
        setUserChoice(contractToOption[playerChoice]);
      }

      const choiceNum = Number(contractChoiceNum);
      if (choiceNum in contractToOption) {
        const compChoice = contractToOption[choiceNum];
        setComputerChoice(compChoice);

        // Determine result based on contract response
        if (playerChoice === choiceNum) {
          setResult("THAT'S A TIE");
        } else if (playerWon) {
          setResult("YOU WIN");
          updateScore(true);
        } else {
          setResult("YOU LOSE");
          updateScore(false);
        }
      }
    } catch (error) {
      console.error("Error processing game result:", error);
      resetGame();
    }
  };

  const handleUserChoice = async (choice: GameOption) => {
    if (!signer || !address) {
      console.error("Wallet not connected");
      return;
    }

    setIsLoading(true);
    setUserChoice(choice);

    try {
      // Check if there's already a game in progress
      const hasActiveGame = await checkGameInProgress();
      
      if (hasActiveGame) {
        // If there's an active game, show an alert or handle accordingly
        console.log("You already have a game in progress");
        await checkGameStatus();
        setIsLoading(false);
        return;
      }
      
      // Convert choice to contract value
      const contractChoice = optionToContract[choice];
      await playGameOnChain(contractChoice);
    } catch (error) {
      console.error("Error handling game choice:", error);
      resetGame();
      setIsLoading(false);
    }
  };

  const resetGame = () => {
    setUserChoice(null);
    setComputerChoice(null);
    setResult(null);
    setTxHash(null);
  };

  return (
    <RockPaperScissorsContext.Provider
      value={{
        userChoice,
        computerChoice,
        result,
        score,
        isLoading,
        txHash,
        entryFee,
        gameInProgress,
        handleUserChoice,
        resetGame,
        checkGameStatus,
        resetOnChainGame,
      }}
    >
      {children}
    </RockPaperScissorsContext.Provider>
  );
};

export const useRockPaperScissors = () => {
  const context = React.useContext(RockPaperScissorsContext);
  if (context === undefined) {
    throw new Error("useRockPaperScissors must be used within a RockPaperScissorsProvider");
  }
  return context;
};

export default RockPaperScissorsProvider;