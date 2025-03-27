// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract WellnessProfiles is Ownable {
    struct Profile {
        string name;
        string bio;
        string profilePicture;
        bool isWellnessProfessional;
    }

    struct Vote {
        address voter;
        string wellnessProfessional;
        uint256 timestamp;
        string voteType; // "upvote" or "downvote"
    }

    mapping(address => Profile) public profiles;
    mapping(address => uint256) public stakes;
    mapping(address => mapping(string => Vote)) public votes;
    uint256 public cooldownPeriod = 86400; // 1 day in seconds

    event ProfileFetched(address indexed profileAddress, Profile profile);
    event VoteAdded(address indexed voter, string wellnessProfessional, Vote vote);
    event RewardsDistributed(address indexed recipient, uint256 amount);

    function fetchProfiles(address[] memory profileAddresses, Profile[] memory profileData) public onlyOwner {
        require(profileAddresses.length == profileData.length, "Input arrays must have the same length");
        for (uint256 i = 0; i < profileAddresses.length; i++) {
            profiles[profileAddresses[i]] = profileData[i];
            emit ProfileFetched(profileAddresses[i], profileData[i]);
        }
    }

    function fetchVotes(address[] memory voterAddresses, Vote[] memory voteData) public onlyOwner {
        require(voterAddresses.length == voteData.length, "Input arrays must have the same length");
        for (uint256 i = 0; i < voterAddresses.length; i++) {
            votes[voterAddresses[i]][voteData[i].wellnessProfessional] = voteData[i];
        }
    }

    function addVote(address voter, string memory wellnessProfessional, string memory voteType) public {
        require(stakes[voter] > 0, "Voter must have a stake");
        require(bytes(profiles[voter].name).length != 0, "Profile does not exist");

        Vote memory newVote = Vote({
            voter: voter,
            wellnessProfessional: wellnessProfessional,
            timestamp: block.timestamp,
            voteType: voteType
        });

        votes[voter][wellnessProfessional] = newVote;
        emit VoteAdded(voter, wellnessProfessional, newVote);
    }

    function distributeRewards(address[] memory professionals, uint256[] memory rewards) public onlyOwner {
        require(professionals.length == rewards.length, "Input arrays must have the same length");
        for (uint256 i = 0; i < professionals.length; i++) {
            address professional = professionals[i];
            uint256 reward = rewards[i];
            // Implement custom reward logic here
            // e.g., Transfer tokens or update balances
            emit RewardsDistributed(professional, reward);
        }
    }

    function voteForService(address wellnessProfessional, string memory voteType) public {
        address sender = msg.sender;
        uint256 senderStake = stakes[sender];
        require(senderStake > 0, "Sender must have a stake");
        require(profiles[wellnessProfessional].isWellnessProfessional, "Wellness professional does not exist");

        Vote memory lastVote = votes[sender][wellnessProfessional];
        uint256 currentTime = block.timestamp;

        require(lastVote.timestamp + cooldownPeriod < currentTime, "Cooldown period not yet passed");

        addVote(sender, wellnessProfessional, voteType);
    }
}
