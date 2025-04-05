const hre = require("hardhat");

async function main() {
  // Deploy reward token first
  const RewardToken = await ethers.getContractFactory("RewardToken");
  const rewardToken = await RewardToken.deploy();
  await rewardToken.deployed();
  console.log("RewardToken deployed to:", rewardToken.address);

  // Deploy WellnessProfiles with reward token address
  const WellnessProfiles = await ethers.getContractFactory("WellnessProfiles");
  const wellnessProfiles = await WellnessProfiles.deploy(rewardToken.address);
  await wellnessProfiles.deployed();
  console.log("WellnessProfiles deployed to:", wellnessProfiles.address);

  // Verify contracts on Etherscan
  if (hre.network.name !== "hardhat") {
    console.log("Waiting for block confirmations...");
    await wellnessProfiles.deployTransaction.wait(6);
    await hre.run("verify:verify", {
      address: wellnessProfiles.address,
      constructorArguments: [rewardToken.address],
    });
    await hre.run("verify:verify", {
      address: rewardToken.address,
      constructorArguments: [],
    });
  }

  // Log deployment info
  console.log("\nDeployment Summary:");
  console.log("-------------------");
  console.log("RewardToken:", rewardToken.address);
  console.log("WellnessProfiles:", wellnessProfiles.address);
  console.log("Network:", hre.network.name);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
