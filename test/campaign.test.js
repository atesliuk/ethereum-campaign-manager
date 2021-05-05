const Campaign = artifacts.require('./Campaign.sol');

contract('Campaign tests', accounts => {
    it('Initializes with correct parameters', async () => {
        const originalOwner = accounts[9];
        const originalName = 'Campaign1';
        const originalDueDate = 12345;
        const originalDonationFee = 3;
        const originalPrizePoolFee = 1;
        const originalMinDonationLimit = 100;
        const originalMaxDonationLimit = 1000;
        const instance = await Campaign.new(
            originalOwner,
            originalName,
            originalDueDate,
            originalDonationFee,
            originalPrizePoolFee,
            originalMinDonationLimit,
            originalMaxDonationLimit
        );
        const owner = await instance.owner();
        assert.equal(owner, originalOwner, 'Contains the correct owner');

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

    it('Can change campaign name', async () => {
        const instance = await Campaign.new(accounts[9], 'Campaign1', 12345, 3, 1, 100, 1000);

        const newName = 'Campaign2';
        await instance.setName(newName, { from: accounts[9] });
        const name = await instance.name();
        assert.equal(name, newName, 'Contains the correct changed name');
    });

    it('Can change campaign due date', async () => {
        const instance = await Campaign.new(accounts[9], 'Campaign1', 12345, 3, 1, 100, 1000);
        const newDueDate = 67890;
        await instance.setDueDate(newDueDate, { from: accounts[9] });
        const dueDate = await instance.dueDate();
        assert.equal(dueDate, newDueDate, 'Contains the correct changed due date');
    });

    it('Can change donation fee', async () => {
        const instance = await Campaign.new(accounts[9], 'Campaign1', 12345, 3, 1, 100, 1000);
        const newDonationFee = 5;
        await instance.setDonationFee(newDonationFee, { from: accounts[9] });
        const donationFee = await instance.donationFee();
        assert.equal(donationFee, newDonationFee, 'Contains the correct changed donation fee');
    });

    it('Cannot set invalid donation fee', async () => {
        try {
            await Campaign.new(accounts[9], 'Campaign1', 12345, 100, 1, 100, 1000);
            assert.fail;
        } catch (error) {
            assert(error.message.indexOf('revert') >= 0, 'error message must contain revert');
        }

        const originalDonationFee = 3;
        const instance = await Campaign.new(accounts[9], 'Campaign1', 12345, originalDonationFee, 1, 100, 1000);

        try {
            await instance.setDonationFee(105, { from: accounts[9] });
            assert.fail;
        } catch (error) {
            assert(error.message.indexOf('revert') >= 0, 'error message must contain revert');
        }

        const donationFee = await instance.donationFee();
        assert.equal(donationFee, originalDonationFee, 'Contains the correct changed donation fee');
    });

    it('Can change prize pool fee', async () => {
        const instance = await Campaign.new(accounts[9], 'Campaign1', 12345, 3, 1, 100, 1000);
        const newPrizePoolFee = 10;
        await instance.setPrizePoolFee(newPrizePoolFee, { from: accounts[9] });
        const prizePoolFee = await instance.prizePoolFee();
        assert.equal(prizePoolFee, newPrizePoolFee, 'Contains the correct changed prize pool fee');
    });

    it('Cannot set invalid prize pool fee', async () => {
        try {
            await Campaign.new(accounts[9], 'Campaign1', 12345, 3, 100, 100, 1000);
            assert.fail;
        } catch (error) {
            assert(error.message.indexOf('revert') >= 0, 'error message must contain revert');
        }

        const originalPrizePoolFee = 1;
        const instance = await Campaign.new(accounts[9], 'Campaign1', 12345, 3, originalPrizePoolFee, 100, 1000);

        try {
            await instance.setPrizePoolFee(105, { from: accounts[9] });
            assert.fail;
        } catch (error) {
            assert(error.message.indexOf('revert') >= 0, 'error message must contain revert');
        }

        const prizePoolFee = await instance.prizePoolFee();
        assert.equal(prizePoolFee, originalPrizePoolFee, 'Contains the correct changed prize pool fee');
    });

    it('Can change donation limits', async () => {
        const instance = await Campaign.new(accounts[9], 'Campaign1', 12345, 3, 1, 100, 1000);

        const newMinDonation = 50;
        const newMaxDonation = 50000;
        await instance.setDonationLimits(newMinDonation, newMaxDonation, { from: accounts[9] });

        const minDonation = await instance.minDonation();
        assert.equal(minDonation, newMinDonation, 'Contains the correct changed min donation');

        const maxDonation = await instance.maxDonation();
        assert.equal(maxDonation, newMaxDonation, 'Contains the correct changed max donation');
    });

    it('Cannot set invalid donation limits', async () => {
        try {
            await Campaign.new(accounts[9], 'Campaign1', 12345, 3, 1, 1000, 10);
            assert.fail;
        } catch (error) {
            assert(error.message.indexOf('revert') >= 0, 'error message must contain revert');
        }

        const originalMinDonation = 100;
        const originalMaxDonation = 1000;
        const instance = await Campaign.new(
            accounts[9],
            'Campaign1',
            12345,
            3,
            1,
            originalMinDonation,
            originalMaxDonation
        );

        try {
            await instance.setDonationLimits(500, 200, { from: accounts[9] });
            assert.fail;
        } catch (error) {
            assert(error.message.indexOf('revert') >= 0, 'error message must contain revert');
        }

        const minDonation = await instance.minDonation();
        assert.equal(minDonation, originalMinDonation, 'Contains the correct changed min donation');

        const maxDonation = await instance.maxDonation();
        assert.equal(maxDonation, originalMaxDonation, 'Contains the correct changed max donation');
    });
});
