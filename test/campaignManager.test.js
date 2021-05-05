const CampaignManager = artifacts.require('./CampaignManager.sol');
const Campaign = artifacts.require('./Campaign.sol');
const BN = web3.utils.BN;

contract('Campaign manager tests', accounts => {
    it('Initializes with correct parameters, owner can change parameters', async () => {
        const originalFee = web3.utils.toWei('0.01', 'ether');
        const instance = await CampaignManager.new(originalFee, { from: accounts[9] });

        let fee = await instance.fee();
        assert.equal(fee, originalFee, 'Campaign manager has the correct fee');

        const newFee = web3.utils.toWei('0.02', 'ether');
        await instance.setFee(newFee, { from: accounts[9] });

        fee = await instance.fee();
        assert.equal(fee, newFee, 'Campaign manager has the correct fee');
    });

    it('Can create campaign', async () => {
        const originalFee = web3.utils.toWei('0.01', 'ether');
        const instance = await CampaignManager.new(originalFee, { from: accounts[9] });

        const originalSCBalance = await web3.eth.getBalance(instance.address);

        const originalCampaignName = 'Campaign1';
        const originalDueDate = 12345;
        const originalDonationFee = 5;
        const originalPrizePoolFee = 1;
        const originalMinDonation = 100;
        const originalMaxDonation = 100;

        await instance.createCampaign(
            originalCampaignName,
            originalDueDate,
            originalDonationFee,
            originalPrizePoolFee,
            originalMinDonation,
            originalMaxDonation,
            {
                from: accounts[0],
                value: originalFee,
            }
        );

        const campaignsCount = await instance.campaignsCount();
        assert.equal(campaignsCount, 1, 'Correct amount of campaigns for the address');

        const campaignAddress = await instance.campaigns(0);
        assert(campaignAddress, 'Has adress of the created campaign smart contract');

        const campaign = new web3.eth.Contract(Campaign.abi, campaignAddress);
        const name = await campaign.methods.name().call();
        const dueDate = await campaign.methods.dueDate().call();
        const donationFee = await campaign.methods.donationFee().call();
        const prizePoolFee = await campaign.methods.prizePoolFee().call();
        const minDonation = await campaign.methods.minDonation().call();
        const maxDonation = await campaign.methods.maxDonation().call();
        const owner = await campaign.methods.owner().call();

        assert.equal(name, originalCampaignName, 'Has correct campaign name');
        assert.equal(dueDate, originalDueDate, 'Has correct due date');
        assert.equal(donationFee, originalDonationFee, 'Has correct donation fee');
        assert.equal(prizePoolFee, originalPrizePoolFee, 'Has correct prize pool fee');
        assert.equal(minDonation, originalMinDonation, 'Has correct minimal donation');
        assert.equal(maxDonation, originalMaxDonation, 'Has correct maximal donation');
        assert.equal(owner, accounts[0], 'Has correct owner');

        const smartContractBalance = await web3.eth.getBalance(instance.address);
        const expectedSCBalance = new BN(originalSCBalance).add(new BN(originalFee));
        assert.equal(smartContractBalance, expectedSCBalance, 'Smart contract has the correct address');
    });

    it('Owner can withdraw funds', async () => {
        const originalFee = web3.utils.toWei('0.01', 'ether');
        const instance = await CampaignManager.new(originalFee, { from: accounts[9] });

        const originalSmartContractBalance = await web3.eth.getBalance(instance.address);
        const originalBalance = await web3.eth.getBalance(accounts[1]);

        await instance.createCampaign('Campaign1', 12345, 5, 1, 100, 1000, { from: accounts[0], value: originalFee });
        await instance.withdraw(accounts[1], originalFee, { from: accounts[9] });

        const expectedBalance = new BN(originalBalance).add(new BN(originalFee));
        const balance = await web3.eth.getBalance(accounts[1]);
        assert.equal(balance, expectedBalance.toString(), 'Address has the correct balance');

        const smartContractBalance = await web3.eth.getBalance(instance.address);
        assert.equal(smartContractBalance, originalSmartContractBalance, 'Smart contract has the correct address');
    });

    it('Owner can withdraw funds by parts', async () => {
        const originalFee = web3.utils.toWei('0.01', 'ether');
        const instance = await CampaignManager.new(originalFee, { from: accounts[9] });

        const originalSmartContractBalance = await web3.eth.getBalance(instance.address);
        const originalBalance = await web3.eth.getBalance(accounts[1]);

        await instance.createCampaign('Campaign1', 12345, 5, 1, 100, 1000, { from: accounts[0], value: originalFee });

        // First withdrawal
        const firstWithdrawal = web3.utils.toWei('0.002', 'ether');
        await instance.withdraw(accounts[1], firstWithdrawal, { from: accounts[9] });

        let expectedBalance = new BN(originalBalance).add(new BN(firstWithdrawal));
        let balance = await web3.eth.getBalance(accounts[1]);
        assert.equal(balance, expectedBalance.toString(), 'Address has the correct balance');

        let smartContractBalance = await web3.eth.getBalance(instance.address);
        const expectedSmartContractBalance = new BN(originalSmartContractBalance)
            .add(new BN(originalFee))
            .sub(new BN(firstWithdrawal));
        assert.equal(
            smartContractBalance,
            expectedSmartContractBalance.toString(),
            'Smart contract has the correct address'
        );

        // Second withdrawal
        const secondWithdrawal = web3.utils.toWei('0.008', 'ether');
        await instance.withdraw(accounts[1], secondWithdrawal, { from: accounts[9] });

        balance = await web3.eth.getBalance(accounts[1]);
        expectedBalance = new BN(originalBalance).add(new BN(originalFee));
        assert.equal(balance, expectedBalance, 'Address has the correct balance');

        smartContractBalance = await web3.eth.getBalance(instance.address);
        assert.equal(smartContractBalance, originalSmartContractBalance, 'Smart contract has the correct address');
    });

    it('Cannot withdraw if not owner', async () => {
        const originalFee = web3.utils.toWei('0.01', 'ether');
        const instance = await CampaignManager.new(originalFee, { from: accounts[9] });

        const originalSmartContractBalance = await web3.eth.getBalance(instance.address);
        const originalBalance = await web3.eth.getBalance(accounts[1]);

        await instance.createCampaign('Campaign1', 12345, 5, 1, 100, 1000, { from: accounts[0], value: originalFee });

        try {
            await instance.withdraw(accounts[1], originalFee, { from: accounts[1] });
            assert.fail;
        } catch (error) {
            assert(error.message.indexOf('revert') >= 0, 'error message must contain revert');
        }

        const balance = await web3.eth.getBalance(accounts[1]);
        assert(balance <= originalBalance, 'Address has the correct balance');

        const smartContractBalance = await web3.eth.getBalance(instance.address);
        expectedSmartContractBalance = new BN(originalSmartContractBalance).add(new BN(originalFee));
        assert.equal(smartContractBalance, expectedSmartContractBalance, 'Smart contract has the correct address');
    });
});
