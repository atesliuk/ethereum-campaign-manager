const Campaign = artifacts.require('./Campaign.sol');

// Testing security
contract('Security tests', accounts => {
    it('Only owner can change campaign properties', async () => {
        const originalName = 'Campaign1';
        const originalDueDate = 12345;
        const originalDonationFee = 3;
        const originalPrizePoolFee = 1;
        const originalMinDonationLimit = 100;
        const originalMaxDonationLimit = 1000;
        const instance = await Campaign.new(
            accounts[9],
            originalName,
            originalDueDate,
            originalDonationFee,
            originalPrizePoolFee,
            originalMinDonationLimit,
            originalMaxDonationLimit,
            { from: accounts[0] }
        );

        try {
            await instance.setName('New name', { from: accounts[1] });
            assert.fail;
        } catch (error) {
            assert(error.message.indexOf('revert') >= 0, 'error message must contain revert');
        }

        try {
            await instance.setDueDate(1111, { from: accounts[1] });
            assert.fail;
        } catch (error) {
            assert(error.message.indexOf('revert') >= 0, 'error message must contain revert');
        }

        try {
            await instance.setDonationFee(15, { from: accounts[1] });
            assert.fail;
        } catch (error) {
            assert(error.message.indexOf('revert') >= 0, 'error message must contain revert');
        }

        try {
            await instance.setPrizePoolFee(25, { from: accounts[1] });
            assert.fail;
        } catch (error) {
            assert(error.message.indexOf('revert') >= 0, 'error message must contain revert');
        }

        try {
            await instance.setDonationLimits(1000, 2000, { from: accounts[1] });
            assert.fail;
        } catch (error) {
            assert(error.message.indexOf('revert') >= 0, 'error message must contain revert');
        }

        const name = await instance.name();
        assert.equal(name, originalName, 'Contains the correct name');

        const dueDate = await instance.dueDate();
        assert.equal(dueDate, originalDueDate, 'Contains the correct due date');

        const donationFee = await instance.donationFee();
        assert.equal(donationFee, originalDonationFee, 'Contains the correct donation fee');

        const prizePoolFee = await instance.prizePoolFee();
        assert.equal(prizePoolFee, originalPrizePoolFee, 'Contains the correct prize pool fee');

        const minDonation = await instance.minDonation();
        assert.equal(minDonation, originalMinDonationLimit, 'Contains the correct min donation');

        const maxDonation = await instance.maxDonation();
        assert.equal(maxDonation, originalMaxDonationLimit, 'Contains the correct max donation');
    });

    it('Only nominator can change candidates properties', async () => {
        const dueDate = Math.round(new Date().getTime() / 1000) + 10000;
        const instance = await Campaign.new(accounts[9], 'Campaign1', dueDate, 3, 1, 100, 1000);

        const originalCandidateName = 'Candidate1';
        const originalCandidateAddress = accounts[1];
        await instance.addCandidate(originalCandidateName, originalCandidateAddress, { from: accounts[0] });

        try {
            await instance.disableCandidate(1, { from: accounts[1] });
            assert.fail;
        } catch (error) {
            assert(error.message.indexOf('revert') >= 0, 'error message must contain revert');
        }

        await instance.disableCandidate(1, { from: accounts[0] });

        try {
            await instance.enableCandidate(1, { from: accounts[1] });
            assert.fail;
        } catch (error) {
            assert(error.message.indexOf('revert') >= 0, 'error message must contain revert');
        }

        try {
            await instance.changeCandidateName(1, 'New name', { from: accounts[1] });
            assert.fail;
        } catch (error) {
            assert(error.message.indexOf('revert') >= 0, 'error message must contain revert');
        }

        try {
            await instance.changeCandidateAddress(1, accounts[1], { from: accounts[1] });
            assert.fail;
        } catch (error) {
            assert(error.message.indexOf('revert') >= 0, 'error message must contain revert');
        }

        const candidate = await instance.candidates(1);
        const name = candidate[1];
        const address = candidate[4];
        assert.equal(name, originalCandidateName, 'Candidate has the correct new name');
        assert.equal(address, originalCandidateAddress, 'Candidate has the correct new name');
    });
});
