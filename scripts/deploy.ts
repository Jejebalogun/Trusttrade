import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Starting TrustTrade deployment...");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);

  // Get account balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");

  // Deploy TrustTrade contract
  console.log("\n📦 Deploying TrustTrade contract...");
  const TrustTrade = await ethers.getContractFactory("TrustTrade");

  // Use deployer as initial fee collector
  const feeCollector = deployer.address;

  const trustTrade = await TrustTrade.deploy(feeCollector);
  await trustTrade.waitForDeployment();

  const contractAddress = await trustTrade.getAddress();
  console.log("✅ TrustTrade deployed to:", contractAddress);
  console.log("💼 Fee Collector set to:", feeCollector);

  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  const deployedFeeCollector = await trustTrade.feeCollector();
  const tradeCounter = await trustTrade.tradeCounter();

  console.log("✓ Fee Collector:", deployedFeeCollector);
  console.log("✓ Trade Counter:", tradeCounter.toString());

  // Save deployment info
  console.log("\n📄 Deployment Summary:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Network:", (await ethers.provider.getNetwork()).name);
  console.log("Chain ID:", (await ethers.provider.getNetwork()).chainId.toString());
  console.log("Contract Address:", contractAddress);
  console.log("Deployer:", deployer.address);
  console.log("Fee Collector:", deployedFeeCollector);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  console.log("\n📋 Next Steps:");
  console.log("1. Copy the contract address to your .env file:");
  console.log(`   NEXT_PUBLIC_CONTRACT_ADDRESS=${contractAddress}`);
  console.log("\n2. Verify contract on Basescan (if deployed to Base Sepolia):");
  console.log(`   npx hardhat verify --network baseSepolia ${contractAddress} "${feeCollector}"`);
  console.log("\n3. Update the contract address in your frontend configuration");

  console.log("\n✨ Deployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
