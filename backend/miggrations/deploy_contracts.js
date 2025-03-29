const WellnessProfiles = artifacts.require("WellnessProfiles");
module.exports = function (deployer) {
  deployer.deploy(WellnessProfiles);
};
