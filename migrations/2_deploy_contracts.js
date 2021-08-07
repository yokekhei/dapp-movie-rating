const MovieRatings = artifacts.require("MovieRatings");

module.exports = function(deployer) {
  deployer.deploy(MovieRatings);
};
