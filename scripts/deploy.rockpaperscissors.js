const hre = require("hardhat");

async function main() {
  console.log("Deploying contracts...");
  
  const RPS = await hre.ethers.getContractFactory("RockPaperScissors");
  const rps = await RPS.deploy();

  await rps.deployed();

  console.log("Deployed RockPaperScissors contract at:", rps.address);

// 0.1 MON for house funds

  // const initialFunds = ethers.utils.parseEther("1.0"); // 1 MON for house funds

  
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
