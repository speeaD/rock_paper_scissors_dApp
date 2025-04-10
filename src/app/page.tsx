/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useRockPaperScissors } from "@/context/RockPaperScissorsContext";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ethers } from "ethers";
import { JSXElementConstructor, ReactElement, ReactNode, ReactPortal, useEffect } from "react";
import { useAccount } from "wagmi";

export type GameOption = "rock" | "paper" | "scissors";
export default function RockPaperScissorsGame() {
  const { address } = useAccount();
  const {
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
    resetOnChainGame
  } = useRockPaperScissors();

  // Check for existing games when component mounts or wallet connects
  useEffect(() => {
    if (address) {
      checkGameStatus();
    }
  }, [address, checkGameStatus]);

  // Function to render the choice display
  const renderChoice = (choice: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined) => {
    if (!choice) return null;
    
    const emoji = {
      rock: "👊",
      paper: "✋",
      scissors: "✌️"
    };
    
    return (
      <div className="flex flex-col items-center justify-center">
        <div className="text-6xl mb-2">{emoji[choice as keyof typeof emoji]}</div>
        <div className="text-lg font-medium capitalize">{choice}</div>
      </div>
    );
  };

  // Render the game-in-progress UI
  const renderGameInProgress = () => {
    return (
      <div className="mb-6 flex flex-col items-center justify-center">
        <div className="flex items-center justify-center mb-4">
          <div className="h-16 w-16 animate-pulse rounded-full border-4 border-yellow-400 flex items-center justify-center">
            <span className="text-xl">⏳</span>
          </div>
        </div>
        <h2 className="text-lg font-bold text-amber-600 mb-4">Game In Progress</h2>
        <p className="text-sm text-gray-600 mb-4 text-center">
          You have an ongoing game on the blockchain. You can check the result or cancel the game.
        </p>
        <div className="flex space-x-3">
          <button
            onClick={checkGameStatus}
            disabled={isLoading}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-white shadow-md transition-colors hover:bg-indigo-700 disabled:opacity-50"
          >
            Check Result
          </button>
          <button
            onClick={resetOnChainGame}
            disabled={isLoading}
            className="rounded-lg bg-red-500 px-4 py-2 text-white shadow-md transition-colors hover:bg-red-600 disabled:opacity-50"
          >
            Cancel Game
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-indigo-800">Rock Paper Scissors</h1>
          <div className="flex items-center gap-2">
            <span className="font-medium text-indigo-600">Score: {score}</span>
            <ConnectButton />
          </div>
        </div>

        <div className="text-xs text-blue-800 font-bold mb-4">
          {address
            ? `Connected: ${address.slice(0, 5) + "..." + address.slice(-5)}`
            : "Please connect your wallet"}
        </div>

        {entryFee && (
          <div className="mb-4 text-sm font-medium text-gray-700">
            Entry Fee: {ethers.utils.formatEther(entryFee)} MON
          </div>
        )}

        {isLoading && (
          <div className="mb-4 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-300 border-t-indigo-600"></div>
            <p className="mt-2 text-sm text-gray-600">
              Processing your request on the blockchain...
            </p>
          </div>
        )}

        {/* Game in progress display */}
        {address && gameInProgress && !result ? (
          renderGameInProgress()
        ) : !userChoice && !isLoading ? (
          <div className="mb-6">
            <h2 className="mb-4 text-center text-lg font-semibold text-gray-700">
              Choose your move:
            </h2>
            <div className="flex justify-center gap-4">
              {["rock", "paper", "scissors"].map((option) => (
                <button
                  key={option}
                  onClick={() => handleUserChoice(option as GameOption)}
                  disabled={!address || isLoading}
                  className="flex h-24 w-24 flex-col items-center justify-center rounded-lg bg-indigo-100 p-4 transition-all hover:bg-indigo-200 hover:shadow-md disabled:opacity-50"
                >
                  <span className="text-4xl mb-1">
                  {option === "rock" ? "👊" : option === "paper" ? "✋" : "✌️"}
                  </span>
                  <span className="text-sm font-medium capitalize">{option}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mb-6">
            <div className="flex items-center justify-around">
              <div className="flex flex-col items-center">
                <h3 className="mb-2 text-sm font-medium text-gray-500">You</h3>
                {userChoice ? renderChoice(userChoice) : <div className="h-20 w-20" />}
              </div>

              <div className="flex flex-col items-center">
                <span className="text-xl font-bold text-gray-700">VS</span>
              </div>

              <div className="flex flex-col items-center">
                <h3 className="mb-2 text-sm font-medium text-gray-500">Computer</h3>
                {computerChoice ? (
                  renderChoice(computerChoice)
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center">
                    {isLoading ? (
                      <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
                    ) : (
                      <div className="text-4xl">❓</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {result && (
              <div className="mt-6 text-center">
                <div
                  className={`mb-2 text-2xl font-bold ${
                    result === "YOU WIN"
                      ? "text-green-600"
                      : result === "YOU LOSE"
                      ? "text-red-600"
                      : "text-gray-600"
                  }`}
                >
                  {result}
                </div>
              </div>
            )}
          </div>
        )}

        {txHash && (
          <div className="mb-4 overflow-hidden text-ellipsis text-xs text-gray-500">
            Transaction: {txHash}
          </div>
        )}

        {(result || userChoice) && (
          <div className="flex justify-center">
            <button
              onClick={resetGame}
              disabled={isLoading}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-white shadow-md transition-colors hover:bg-indigo-700 disabled:opacity-50"
            >
              Play Again
            </button>
          </div>
        )}

        {!address && (
          <div className="mt-4 text-center text-sm text-red-500">
            Connect your wallet to play!
          </div>
        )}
      </div>
    </div>
  );
}