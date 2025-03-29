async function main() {
  const WellnessProfiles = await ethers.getContractFactory("WellnessProfiles");
  const wellnessProfiles = await WellnessProfiles.deploy();
  await wellnessProfiles.deployed();
  console.log("WellnessProfiles deployed to:", wellnessProfiles.address);
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
