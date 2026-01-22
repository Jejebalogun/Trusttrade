import { ethers } from "hardhat";

async function main() {
  console.log("🪙 Deploying Mock DAK Token for testing...");

  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);

  // Deploy Mock ERC20 Token (DAK Token)
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const initialSupply = ethers.parseEther("1000000"); // 1 million tokens

  const dakToken = await MockERC20.deploy("DAK Token", "DAK", initialSupply);
  await dakToken.waitForDeployment();

  const tokenAddress = await dakToken.getAddress();
  console.log("✅ DAK Token deployed to:", tokenAddress);
  console.log("💰 Initial Supply:", ethers.formatEther(initialSupply), "DAK");

  // Verify deployment
  const balance = await dakToken.balanceOf(deployer.address);
  const name = await dakToken.name();
  const symbol = await dakToken.symbol();

  console.log("\n📄 Token Details:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Name:", name);
  console.log("Symbol:", symbol);
  console.log("Token Address:", tokenAddress);
  console.log("Deployer Balance:", ethers.formatEther(balance), "DAK");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  console.log("\n✨ Mock token deployment complete!");
  console.log("📋 You can now use this token address for testing trades.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
