"use client";
import { WagmiConfig } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
// import DataContextProvider from "@/context/DataContext";
import { wagmiConfig } from "@/utils/wallet-utils";
import RockPaperScissorsProvider from "@/context/RockPaperScissorsContext";
import { contractAddress, contractAbi } from "@/constant/index";

const queryClient = new QueryClient();

import { ReactNode } from "react";

const Providers = ({ children }: { children: ReactNode }) => {
  return (
    <>
      <WagmiConfig config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider>
            <RockPaperScissorsProvider contractAddress={contractAddress} contractAbi={contractAbi}>{children}</RockPaperScissorsProvider>
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiConfig>
    </>
  );
};

export default Providers;
