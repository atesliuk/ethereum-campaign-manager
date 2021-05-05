const CampaignManager = artifacts.require('./CampaignManager.sol');
const Campaign = artifacts.require('./Campaign.sol');

module.exports = function (deployer) {
    deployer.deploy(CampaignManager, 1);
    deployer.deploy(
        Campaign,
        deployer.networks?.ganache?.from || '0xCcEbC2FB3330C644C467c379354f51bf505A0d34',
        'New campanign',
        1111,
        50,
        50,
        100,
        1000
    );
};
