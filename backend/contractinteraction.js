const { ethers } = require('ethers');
const contractABI = [/* ABI from WellnessProfiles.json */];
const contractAddress = '0xYourContractAddress';
const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
const contract = new ethers.Contract(contractAddress, contractABI, provider);

async function vote(voter, wellnessProfessional, voteType) {
  const signer = provider.getSigner(voter);
  const tx = await contract.connect(signer).addVote(voter, wellnessProfessional, voteType);
  await tx.wait();
  console.log('Vote recorded:', voter, wellnessProfessional, voteType);
}
