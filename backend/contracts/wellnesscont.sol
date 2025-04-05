// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title WellnessProfiles
/// @notice A contract for managing wellness professional profiles and voting
/// @dev Implements voting system with staking, cooldown periods, and reputation
contract WellnessProfiles is Ownable, ReentrancyGuard, Pausable {
    using Strings for string;

    struct Profile {
        string name;
        string bio;
        string profilePicture;
        bool isWellnessProfessional;
        uint256 upvotes;
        uint256 downvotes;
        uint256 reputation; // 0-100 scale
        uint256 totalStake;
        uint256 lastRewardClaim;
    }

    struct Vote {
        address voter;
        bytes32 wellnessProfessionalHash;
        uint256 timestamp;
        VoteType voteType;
        uint256 stakeAmount;
    }

    struct BatchOperation {
        address[] addresses;
        uint256[] values;
        OperationType operationType;
    }

    enum VoteType { UP, DOWN }
    enum OperationType { STAKE, REWARD, REPUTATION }

    mapping(address => Profile) public profiles;
    mapping(address => uint256) public stakes;
    mapping(address => mapping(bytes32 => Vote)) public votes;
    mapping(bytes32 => string) public professionalNames;
    mapping(address => uint256) public delegatedStakes;
    mapping(address => address) public stakeDelegations;
    
    uint256 public cooldownPeriod = 86400; // 1 day in seconds
    uint256 public constant MAX_NAME_LENGTH = 50;
    uint256 public constant MAX_BIO_LENGTH = 500;
    uint256 public constant MIN_STAKE = 0.1 ether;
    uint256 public constant REWARD_COOLDOWN = 604800; // 7 days in seconds
    uint256 public constant MAX_REPUTATION = 100;
    uint256 public constant REPUTATION_INCREASE = 5;
    uint256 public constant REPUTATION_DECREASE = 3;

    IERC20 public rewardToken;

    event ProfileFetched(address indexed profileAddress, Profile profile);
    event VoteAdded(address indexed voter, string wellnessProfessional, Vote vote);
    event RewardsDistributed(address indexed recipient, uint256 amount);
    event ProfileUpdated(address indexed profileAddress, Profile profile);
    event StakeUpdated(address indexed user, uint256 amount);
    event CooldownUpdated(uint256 newCooldown);
    event ReputationUpdated(address indexed user, uint256 newReputation);
    event StakeDelegated(address indexed from, address indexed to, uint256 amount);
    event BatchOperationExecuted(OperationType operationType, uint256 count);

    /// @notice Constructor to initialize the contract with reward token
    /// @param _rewardToken Address of the ERC20 token used for rewards
    constructor(address _rewardToken) {
        require(_rewardToken != address(0), "Invalid reward token address");
        rewardToken = IERC20(_rewardToken);
    }

    /// @notice Updates multiple profiles at once
    /// @param profileAddresses Array of addresses to update
    /// @param profileData Array of profile data to set
    function fetchProfiles(address[] memory profileAddresses, Profile[] memory profileData) 
        public 
        onlyOwner 
        nonReentrant 
        whenNotPaused
    {
        require(profileAddresses.length == profileData.length, "Input arrays must have the same length");
        for (uint256 i = 0; i < profileAddresses.length; i++) {
            require(bytes(profileData[i].name).length <= MAX_NAME_LENGTH, "Name too long");
            require(bytes(profileData[i].bio).length <= MAX_BIO_LENGTH, "Bio too long");
            profiles[profileAddresses[i]] = profileData[i];
            emit ProfileFetched(profileAddresses[i], profileData[i]);
        }
    }

    /// @notice Updates a single profile
    /// @param profileAddress Address to update
    /// @param profileData New profile data
    function updateProfile(address profileAddress, Profile memory profileData) 
        public 
        onlyOwner 
        nonReentrant 
        whenNotPaused
    {
        require(bytes(profileData.name).length <= MAX_NAME_LENGTH, "Name too long");
        require(bytes(profileData.bio).length <= MAX_BIO_LENGTH, "Bio too long");
        profiles[profileAddress] = profileData;
        emit ProfileUpdated(profileAddress, profileData);
    }

    /// @notice Updates a user's stake
    /// @param user Address to update stake for
    /// @param amount New stake amount
    function updateStake(address user, uint256 amount) 
        public 
        onlyOwner 
        nonReentrant 
        whenNotPaused
    {
        require(amount >= MIN_STAKE, "Stake below minimum");
        stakes[user] = amount;
        profiles[user].totalStake = amount;
        emit StakeUpdated(user, amount);
    }

    /// @notice Updates the cooldown period
    /// @param newCooldown New cooldown period in seconds
    function updateCooldown(uint256 newCooldown) 
        public 
        onlyOwner 
    {
        cooldownPeriod = newCooldown;
        emit CooldownUpdated(newCooldown);
    }

    /// @notice Adds a vote for a wellness professional
    /// @param wellnessProfessional Name of the professional
    /// @param voteType Type of vote (UP or DOWN)
    function voteForService(string memory wellnessProfessional, VoteType voteType) 
        public 
        nonReentrant 
        whenNotPaused
    {
        address sender = msg.sender;
        require(stakes[sender] > 0, "Sender must have a stake");
        require(bytes(wellnessProfessional).length > 0, "Invalid professional name");
        
        bytes32 professionalHash = keccak256(bytes(wellnessProfessional));
        require(profiles[msg.sender].isWellnessProfessional, "Wellness professional does not exist");

        Vote memory lastVote = votes[sender][professionalHash];
        require(lastVote.timestamp + cooldownPeriod < block.timestamp, "Cooldown period not yet passed");

        Vote memory newVote = Vote({
            voter: sender,
            wellnessProfessionalHash: professionalHash,
            timestamp: block.timestamp,
            voteType: voteType,
            stakeAmount: stakes[sender]
        });

        votes[sender][professionalHash] = newVote;
        professionalNames[professionalHash] = wellnessProfessional;

        // Update vote counts and reputation
        if (voteType == VoteType.UP) {
            profiles[msg.sender].upvotes++;
            _updateReputation(msg.sender, true);
        } else {
            profiles[msg.sender].downvotes++;
            _updateReputation(msg.sender, false);
        }

        emit VoteAdded(sender, wellnessProfessional, newVote);
    }

    /// @notice Gets the total votes for a professional
    /// @param professionalHash Hash of the professional's name
    /// @return upvotes Number of upvotes
    /// @return downvotes Number of downvotes
    function getProfessionalVotes(bytes32 professionalHash) 
        public 
        view 
        returns (uint256 upvotes, uint256 downvotes) 
    {
        return (profiles[msg.sender].upvotes, profiles[msg.sender].downvotes);
    }

    /// @notice Delegate stake to another address
    /// @param delegate Address to delegate stake to
    /// @param amount Amount to delegate
    function delegateStake(address delegate, uint256 amount) 
        public 
        nonReentrant 
        whenNotPaused
    {
        require(stakes[msg.sender] >= amount, "Insufficient stake");
        require(delegate != msg.sender, "Cannot delegate to self");
        require(delegate != address(0), "Invalid delegate address");

        stakes[msg.sender] -= amount;
        delegatedStakes[delegate] += amount;
        stakeDelegations[msg.sender] = delegate;

        emit StakeDelegated(msg.sender, delegate, amount);
    }

    /// @notice Execute batch operations
    /// @param operations Array of batch operations to execute
    function executeBatchOperations(BatchOperation[] memory operations) 
        public 
        onlyOwner 
        nonReentrant 
        whenNotPaused
    {
        for (uint256 i = 0; i < operations.length; i++) {
            BatchOperation memory op = operations[i];
            require(op.addresses.length == op.values.length, "Array length mismatch");

            for (uint256 j = 0; j < op.addresses.length; j++) {
                if (op.operationType == OperationType.STAKE) {
                    updateStake(op.addresses[j], op.values[j]);
                } else if (op.operationType == OperationType.REWARD) {
                    _distributeReward(op.addresses[j], op.values[j]);
                } else if (op.operationType == OperationType.REPUTATION) {
                    _updateReputation(op.addresses[j], op.values[j] > 0);
                }
            }
        }
        emit BatchOperationExecuted(operations[0].operationType, operations[0].addresses.length);
    }

    /// @notice Pause the contract
    function pause() public onlyOwner {
        _pause();
    }

    /// @notice Unpause the contract
    function unpause() public onlyOwner {
        _unpause();
    }

    /// @notice Internal function to update reputation
    /// @param user Address to update reputation for
    /// @param increase Whether to increase or decrease reputation
    function _updateReputation(address user, bool increase) internal {
        uint256 currentRep = profiles[user].reputation;
        if (increase) {
            profiles[user].reputation = currentRep + REPUTATION_INCREASE > MAX_REPUTATION ? 
                MAX_REPUTATION : currentRep + REPUTATION_INCREASE;
        } else {
            profiles[user].reputation = currentRep > REPUTATION_DECREASE ? 
                currentRep - REPUTATION_DECREASE : 0;
        }
        emit ReputationUpdated(user, profiles[user].reputation);
    }

    /// @notice Internal function to distribute rewards
    /// @param recipient Address to receive reward
    /// @param amount Amount of reward
    function _distributeReward(address recipient, uint256 amount) internal {
        require(block.timestamp >= profiles[recipient].lastRewardClaim + REWARD_COOLDOWN, "Reward cooldown not passed");
        require(rewardToken.transfer(recipient, amount), "Reward transfer failed");
        profiles[recipient].lastRewardClaim = block.timestamp;
        emit RewardsDistributed(recipient, amount);
    }
}
