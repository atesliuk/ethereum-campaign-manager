const Campaign = artifacts.require('./Campaign.sol');

// Testing candidate
contract('Candidates tests', accounts => {
    it('Can add candidate', async () => {
        const dueDate = Math.round(new Date().getTime() / 1000) + 10000;
        const instance = await Campaign.new(accounts[9], 'Campaign1', dueDate, 3, 1, 100, 1000);
        let candidatesCount = await instance.candidatesCount();
        assert(candidatesCount, 0, 'Correct number of candidates');

        await instance.addCandidate('Candidate1', accounts[0], { from: accounts[0] });

        candidatesCount = await instance.candidatesCount();
        assert(candidatesCount, 0, 'Correct number of candidates');

        const candidate = await instance.candidates(1);
        const id = candidate[0].toNumber();
        assert.equal(id, 1, 'Candidate has the correct id');

        const name = candidate[1];
        assert.equal(name, 'Candidate1', 'Candidate has the correct name');

        const votes = candidate[2].toNumber();
        assert.equal(votes, 0, 'Candidate has the correct number of votes');

        const active = candidate[3];
        assert.equal(active, true, 'Candidate is active');

        const address = candidate[4];
        assert.equal(address, accounts[0], 'Candidate has the correct address');
    });

    it('Can change candidate name', async () => {
        const dueDate = Math.round(new Date().getTime() / 1000) + 10000;
        const instance = await Campaign.new(accounts[9], 'Campaign1', dueDate, 3, 1, 100, 1000);
        await instance.addCandidate('Candidate1', accounts[0], { from: accounts[0] });
        await instance.changeCandidateName(1, 'Candidate2');
        const candidate = await instance.candidates(1);
        const name = candidate[1];
        assert.equal(name, 'Candidate2', 'Candidate has the correct new name');
    });

    it('Can change candidate address', async () => {
        const dueDate = Math.round(new Date().getTime() / 1000) + 10000;
        const instance = await Campaign.new(accounts[9], 'Campaign1', dueDate, 3, 1, 100, 1000);
        await instance.addCandidate('Candidate1', accounts[0], { from: accounts[0] });
        await instance.changeCandidateAddress(1, accounts[1]);
        const candidate = await instance.candidates(1);
        const address = candidate[4];
        assert.equal(address, accounts[1], 'Candidate has the correct new address');
    });

    it('Cannot change address on already used address', async () => {
        const dueDate = Math.round(new Date().getTime() / 1000) + 10000;
        const instance = await Campaign.new(accounts[9], 'Campaign1', dueDate, 3, 1, 100, 1000);
        await instance.addCandidate('Candidate1', accounts[0], { from: accounts[0] });

        try {
            await instance.addCandidate('Candidate2', accounts[0], { from: accounts[0] });
            assert.fail;
        } catch (error) {
            assert(error.message.indexOf('revert') >= 0, 'error message must contain revert');
        }

        await instance.addCandidate('Candidate2', accounts[1], {
            from: accounts[0],
        });

        try {
            await instance.changeCandidateAddress(2, accounts[0]);
            assert.fail;
        } catch (error) {
            assert(error.message.indexOf('revert') >= 0, 'error message must contain revert');
        }
        const candidate = await instance.candidates(2);
        const address = candidate[4];
        assert.equal(address, accounts[1], 'Candidate has the correct new address');
    });

    it('Can disable candidate', async () => {
        const dueDate = Math.round(new Date().getTime() / 1000) + 10000;
        const instance = await Campaign.new(accounts[9], 'Campaign1', dueDate, 3, 1, 100, 1000);
        await instance.addCandidate('Candidate1', accounts[0], { from: accounts[0] });
        await instance.disableCandidate(1);
        const candidate = await instance.candidates(1);
        const isActive = candidate[3];
        assert.equal(isActive, false, 'Candidate has the correct activity status');
    });

    it('Can enable candidate', async () => {
        const dueDate = Math.round(new Date().getTime() / 1000) + 10000;
        const instance = await Campaign.new(accounts[9], 'Campaign1', dueDate, 3, 1, 100, 1000);
        await instance.addCandidate('Candidate1', accounts[0], { from: accounts[0] });
        await instance.disableCandidate(1);
        await instance.enableCandidate(1);
        const candidate = await instance.candidates(1);
        const isActive = candidate[3];
        assert.equal(isActive, true, 'Candidate has the correct activity status');
    });

    it('Cannot disable inactive candidate', async () => {
        const dueDate = Math.round(new Date().getTime() / 1000) + 10000;
        const instance = await Campaign.new(accounts[9], 'Campaign1', dueDate, 3, 1, 100, 1000);
        await instance.addCandidate('Candidate1', accounts[0], { from: accounts[0] });
        await instance.disableCandidate(1);

        try {
            await instance.disableCandidate(1);
            assert.fail;
        } catch (error) {
            assert(error.message.indexOf('revert') >= 0, 'error message must contain revert');
        }

        const candidate = await instance.candidates(1);
        const isActive = candidate[3];
        assert.equal(isActive, false, 'Candidate has the correct activity status');
    });

    it('Cannot enable active candidate', async () => {
        const dueDate = Math.round(new Date().getTime() / 1000) + 10000;
        const instance = await Campaign.new(accounts[9], 'Campaign1', dueDate, 3, 1, 100, 1000);
        await instance.addCandidate('Candidate1', accounts[0], { from: accounts[0] });

        try {
            await instance.enableCandidate(1);
            assert.fail;
        } catch (error) {
            assert(error.message.indexOf('revert') >= 0, 'error message must contain revert');
        }

        const candidate = await instance.candidates(1);
        const isActive = candidate[3];
        assert.equal(isActive, true, 'Candidate has the correct activity status');
    });

    it('Cannot change properties of non-existing candidate', async () => {
        const dueDate = Math.round(new Date().getTime() / 1000) + 10000;
        const instance = await Campaign.new(accounts[9], 'Campaign1', dueDate, 3, 1, 100, 1000);

        try {
            await instance.enableCandidate(1);
            assert.fail;
        } catch (error) {
            assert(error.message.indexOf('revert') >= 0, 'error message must contain revert');
        }

        try {
            await instance.disableCandidate(1);
            assert.fail;
        } catch (error) {
            assert(error.message.indexOf('revert') >= 0, 'error message must contain revert');
        }

        try {
            await instance.changeCandidateName(1, 'New candidate');
            assert.fail;
        } catch (error) {
            assert(error.message.indexOf('revert') >= 0, 'error message must contain revert');
        }

        try {
            await instance.changeCandidateAddress(1, accounts[0]);
            assert.fail;
        } catch (error) {
            assert(error.message.indexOf('revert') >= 0, 'error message must contain revert');
        }
    });

    it('Cannot add candidate when campaign is finished', async () => {
        const instance = await Campaign.new(accounts[9], 'Campaign1', 12345, 3, 1, 100, 1000);

        try {
            await instance.addCandidate('Candidate1', accounts[0], { from: accounts[0] });
            assert.fail;
        } catch (error) {
            assert(error.message.indexOf('revert') >= 0, 'error message must contain revert');
        }

        const candidatesCount = await instance.candidatesCount();
        assert.equal(candidatesCount, 0, 'Has correct candidate count');
    });

    it('Cannot disable candidate when campaign is finished', async () => {
        const dueDate = Math.round(new Date().getTime() / 1000) + 10000;
        const instance = await Campaign.new(accounts[9], 'Campaign1', dueDate, 3, 1, 100, 1000);

        await instance.addCandidate('Candidate1', accounts[1], { from: accounts[0] });
        await instance.setDueDate(12345, { from: accounts[9] });

        try {
            await instance.disableCandidate(1, { from: accounts[0] });
            assert.fail;
        } catch (error) {
            assert(error.message.indexOf('revert') >= 0, 'error message must contain revert');
        }

        const candidate = await instance.candidates(1);
        const isActive = candidate[3];
        assert(isActive, 'Candidate has the correct activity status');
    });

    it('Cannot enable candidate when campaign is finished', async () => {
        const dueDate = Math.round(new Date().getTime() / 1000) + 10000;
        const instance = await Campaign.new(accounts[9], 'Campaign1', dueDate, 3, 1, 100, 1000);

        await instance.addCandidate('Candidate1', accounts[1], { from: accounts[0] });
        await instance.disableCandidate(1, { from: accounts[0] });
        await instance.setDueDate(12345, { from: accounts[9] });

        try {
            await instance.enableCandidate(1, { from: accounts[0] });
            assert.fail;
        } catch (error) {
            assert(error.message.indexOf('revert') >= 0, 'error message must contain revert');
        }

        const candidate = await instance.candidates(1);
        const isActive = candidate[3];
        assert(!isActive, 'Candidate has the correct activity status');
    });
});
