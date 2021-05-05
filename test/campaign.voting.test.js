const Campaign = artifacts.require('./Campaign.sol');

// Testing voting
contract('Voting tests', accounts => {
    it('Can vote for a candidate', async () => {
        const futureDueDate = Math.round(new Date().getTime() / 1000) + 10000;
        const instance = await Campaign.new(accounts[9], 'Campaign1', futureDueDate, 3, 1, 100, 1000);
        await instance.addCandidate('Candidate1', accounts[0], { from: accounts[0] });

        let candidate = await instance.candidates(1);
        const votesBeforeVoting = candidate[2].toNumber();
        assert.equal(votesBeforeVoting, 0, 'Candidate has the correct number of votes');

        await instance.vote(1, { from: accounts[0] });
        candidate = await instance.candidates(1);
        const votesAfterVoting = candidate[2].toNumber();
        assert.equal(votesAfterVoting, 1, 'Candidate has the correct number of votes');
    });

    it('Cannot vote twice', async () => {
        const futureDueDate = Math.round(new Date().getTime() / 1000) + 10000;
        const instance = await Campaign.new(accounts[9], 'Campaign1', futureDueDate, 3, 1, 100, 1000);

        await instance.addCandidate('Candidate1', accounts[0], { from: accounts[0] });
        await instance.vote(1, { from: accounts[0] });

        await instance.addCandidate('Candidate2', accounts[1], { from: accounts[0] });
        try {
            await instance.vote(2, { from: accounts[0] });
            assert.fail;
        } catch (error) {
            assert(error.message.indexOf('revert') >= 0, 'error message must contain revert');
        }

        const candidate = await instance.candidates(1);
        const votes = candidate[2].toNumber();
        assert.equal(votes, 1, 'Candidate has the correct number of votes');

        const candidate2 = await instance.candidates(2);
        const votes2 = candidate2[2].toNumber();
        assert.equal(votes2, 0, 'Candidate has the correct number of votes');
    });

    it('Cannot vote for inactive candidate', async () => {
        const futureDueDate = Math.round(new Date().getTime() / 1000) + 10000;
        const instance = await Campaign.new(accounts[9], 'Campaign1', futureDueDate, 3, 1, 100, 1000);

        await instance.addCandidate('Candidate1', accounts[0], { from: accounts[0] });
        await instance.disableCandidate(1, { from: accounts[0] });

        try {
            await instance.vote(1, { from: accounts[0] });
            assert.fail;
        } catch (error) {
            assert(error.message.indexOf('revert') >= 0, 'error message must contain revert');
        }

        const candidate = await instance.candidates(1);
        const votes = candidate[2].toNumber();
        assert.equal(votes, 0, 'Candidate has the correct number of votes');
    });

    it('Cannot vote for non existing candidate', async () => {
        const futureDueDate = Math.round(new Date().getTime() / 1000) + 10000;
        const instance = await Campaign.new(accounts[9], 'Campaign1', futureDueDate, 3, 1, 100, 1000);

        try {
            await instance.vote(1, { from: accounts[0] });
            assert.fail;
        } catch (error) {
            assert(error.message.indexOf('revert') >= 0, 'error message must contain revert');
        }
    });

    it('Cannot vote when campaign is finished', async () => {
        const futureDueDate = Math.round(new Date().getTime() / 1000) + 10000;
        const instance = await Campaign.new(accounts[9], 'Campaign1', futureDueDate, 3, 1, 100, 1000);

        await instance.addCandidate('Candidate1', accounts[0], { from: accounts[0] });
        await instance.setDueDate(12345, { from: accounts[9] });

        try {
            await instance.vote(1, { from: accounts[0] });
            assert.fail;
        } catch (error) {
            assert(error.message.indexOf('revert') >= 0, 'error message must contain revert');
        }

        const candidate = await instance.candidates(1);
        const votes = candidate[2].toNumber();
        assert.equal(votes, 0, 'Candidate has the correct number of votes');
    });
});
