const Campaign = artifacts.require('./Campaign.sol');
const BN = web3.utils.BN;

// Testing donations to candidates
contract('Candidates donation tests', accounts => {
    it('Can donate to a candidate', async () => {
        const dueDate = Math.round(new Date().getTime() / 1000) + 10000;
        const donationFee = 5; // in percents
        const instance = await Campaign.new(
            accounts[9],
            'Campaign1',
            dueDate,
            donationFee,
            1,
            web3.utils.toWei('0.0001', 'ether'),
            web3.utils.toWei('1000', 'ether')
        );
        const originalSmartContractBalance = await web3.eth.getBalance(instance.address);

        await instance.addCandidate('Candidate1', accounts[1], { from: accounts[0] });
        const originalBalance = await web3.eth.getBalance(accounts[1]);
        const donation = web3.utils.toWei('1', 'ether');

        await instance.donateToCandidate(1, { from: accounts[0], value: donation });

        const balance = await web3.eth.getBalance(accounts[1]);
        const donationAfterFee = new BN(donation).mul(new BN(100 - donationFee)).div(new BN(100));
        const expectedBalance = new BN(originalBalance).add(donationAfterFee);

        assert.equal(balance, expectedBalance.toString(), 'address must have correct balance');

        const expectedSmartContractBalance = new BN(originalSmartContractBalance).add(
            new BN(donation).mul(new BN(donationFee)).div(new BN(100))
        );
        const smartContractBalance = await web3.eth.getBalance(instance.address);
        assert.equal(
            smartContractBalance,
            expectedSmartContractBalance.toString(),
            'smart contract has the correct balance'
        );
    });

    it('Cannot donate out of limits', async () => {
        const donationFee = 5; // in percents
        const dueDate = Math.round(new Date().getTime() / 1000) + 10000;
        const instance = await Campaign.new(accounts[9], 'Campaign1', dueDate, donationFee, 1, 100, 1000);
        const originalSmartContractBalance = await web3.eth.getBalance(instance.address);

        await instance.addCandidate('Candidate1', accounts[1], { from: accounts[0] });
        const originalBalance = await web3.eth.getBalance(accounts[1]);

        try {
            await instance.donateToCandidate(1, { from: accounts[0], value: 50 });
            assert.fail;
        } catch (error) {
            assert(error.message.indexOf('revert') >= 0, 'error message must contain revert');
        }

        try {
            await instance.donateToCandidate(1, { from: accounts[0], value: 50000 });
            assert.fail;
        } catch (error) {
            assert(error.message.indexOf('revert') >= 0, 'error message must contain revert');
        }

        const donation = 500;
        await instance.donateToCandidate(1, { from: accounts[0], value: donation });

        try {
            await instance.donateToCandidate(1, { from: accounts[0], value: 501 });
            assert.fail;
        } catch (error) {
            assert(error.message.indexOf('revert') >= 0, 'error message must contain revert');
        }

        const balance = await web3.eth.getBalance(accounts[1]);
        const expectedBalance = new BN(originalBalance).add(
            new BN(donation).mul(new BN(100 - donationFee)).div(new BN(100))
        );
        assert.equal(balance, expectedBalance.toString(), 'address has the correct balance');

        const smartContractBalance = await web3.eth.getBalance(instance.address);
        const expectedSmartContractBalance = new BN(originalSmartContractBalance).add(
            new BN(donation).mul(new BN(donationFee)).div(new BN(100))
        );
        assert.equal(
            smartContractBalance,
            expectedSmartContractBalance.toString(),
            'smart contract has the correct balance'
        );
    });

    it('Cannot donate to non existing candidate', async () => {
        const instance = await Campaign.new(accounts[9], 'Campaign1', 12345, 5, 1, 100, 1000);
        const originalSmartContractBalacne = await web3.eth.getBalance(instance.address);

        const candidatesCount = await instance.candidatesCount();
        assert.equal(candidatesCount, 0, 'Number of candidates is correct');

        try {
            await instance.donateToCandidate(1, { from: accounts[0], value: 500 });
            assert.fail;
        } catch (error) {
            assert(error.message.indexOf('revert') >= 0, 'error message must contain revert');
        }

        const smartContractBalance = await web3.eth.getBalance(instance.address);
        assert.equal(smartContractBalance, originalSmartContractBalacne, 'smart contract has the correct balance');
    });

    it('Cannot donate to inactive candidate', async () => {
        const dueDate = Math.round(new Date().getTime() / 1000) + 10000;
        const instance = await Campaign.new(accounts[9], 'Campaign1', dueDate, 5, 1, 100, 1000);
        const originalSmartContractBalance = await web3.eth.getBalance(instance.address);

        await instance.addCandidate('Candidate1', accounts[1], { from: accounts[0] });
        const originalBalance = await web3.eth.getBalance(accounts[1]);

        await instance.disableCandidate(1, { from: accounts[0] });
        try {
            await instance.donateToCandidate(1, { from: accounts[0], value: 500 });
            assert.fail;
        } catch (error) {
            assert(error.message.indexOf('revert') >= 0, 'error message must contain revert');
        }

        const balance = await web3.eth.getBalance(accounts[1]);
        const smartContractBalance = await web3.eth.getBalance(instance.address);

        assert.equal(balance, originalBalance, 'address has the correct balance');
        assert.equal(smartContractBalance, originalSmartContractBalance, 'smart contract has the correct balance');
    });
});

// Testing donations to prize pool
contract('Prize pool donation tests', accounts => {
    it('Can donate to prize pool', async () => {
        const prizePoolFee = 1; //in percents
        const instance = await Campaign.new(accounts[9], 'Campaign1', 12345, 5, prizePoolFee, 100, 1000);
        const originalSmartContractBalance = await web3.eth.getBalance(instance.address);

        const donation = web3.utils.toWei('1', 'ether');
        await web3.eth.sendTransaction({ from: accounts[0], to: instance.address, value: donation });

        const prizePool = await instance.prizePool();
        const expectedPrizePool = new BN(donation).mul(new BN(100 - prizePoolFee)).div(new BN(100));
        assert.equal(prizePool, expectedPrizePool.toString(), 'prize pool must have correct balance');

        const smartContractBalance = await web3.eth.getBalance(instance.address);
        const expectedBalance = new BN(originalSmartContractBalance).add(new BN(donation));

        assert.equal(smartContractBalance, expectedBalance.toString(), 'smart contract must have correct balance');
    });
});

// Testing withdrawal from prize pool as a winner
contract('Withdrawal tests', accounts => {
    it('Winner can withdraw prize pool', async () => {
        const oneEther = web3.utils.toWei('1', 'ether');
        const prizePoolFee = 1; // in percents
        const futureDueDate = Math.round(new Date().getTime() / 1000) + 10000;
        const instance = await Campaign.new(accounts[9], 'Campaign1', futureDueDate, 5, prizePoolFee, 100, oneEther);
        const originalSmartContractBalance = await web3.eth.getBalance(instance.address);

        await instance.addCandidate('Candidate1', accounts[1], { from: accounts[0] });
        await instance.addCandidate('Candidate2', accounts[2], { from: accounts[0] });
        await instance.vote(1, { from: accounts[0] });

        const donation = oneEther;
        await web3.eth.sendTransaction({ from: accounts[0], to: instance.address, value: donation });
        await instance.setDueDate(12345, { from: accounts[9] });

        const prizePool = await instance.prizePool();
        const originalBalance = await web3.eth.getBalance(accounts[1]);

        const receipt = await instance.withdrawPrizePool(1, { from: accounts[1] });
        const gasUsed = receipt.receipt.gasUsed;
        const transaction = await web3.eth.getTransaction(receipt.tx);
        const gasPrice = transaction.gasPrice;
        const gasExpenses = new BN(gasUsed).mul(new BN(gasPrice));

        const winnerExpectedBalance = new BN(originalBalance).sub(gasExpenses).add(prizePool);
        const winnerBalance = await web3.eth.getBalance(accounts[1]);
        assert.equal(winnerBalance, winnerExpectedBalance.toString(), 'winner has the correct balance');

        const expectedSmartContractBalance = new BN(originalSmartContractBalance).add(
            new BN(donation).mul(new BN(prizePoolFee)).div(new BN(100))
        );
        const smartContractBalance = await web3.eth.getBalance(instance.address);
        assert.equal(
            smartContractBalance,
            expectedSmartContractBalance.toString(),
            'smart contract has the correct balance'
        );
    });

    it('Two winners can withdraw parts of the prize pool', async () => {
        const oneEther = web3.utils.toWei('1', 'ether');
        const prizePoolFee = 1; // in percents
        const futureDueDate = Math.round(new Date().getTime() / 1000) + 10000;
        const instance = await Campaign.new(accounts[9], 'Campaign1', futureDueDate, 5, prizePoolFee, 100, oneEther);
        const originalSmartContractBalance = await web3.eth.getBalance(instance.address);

        await instance.addCandidate('Candidate1', accounts[1], { from: accounts[0] });
        await instance.addCandidate('Candidate2', accounts[2], { from: accounts[0] });
        await instance.addCandidate('Candidate3', accounts[3], { from: accounts[0] });
        await instance.vote(1, { from: accounts[0] });
        await instance.vote(2, { from: accounts[1] });

        const donation = oneEther;
        await web3.eth.sendTransaction({ from: accounts[0], to: instance.address, value: donation });
        await instance.setDueDate(12345, { from: accounts[9] });

        const originalPrizePool = await instance.prizePool();

        // Winner 1 withdrawing
        const originalBalance1 = await web3.eth.getBalance(accounts[1]);

        const receipt1 = await instance.withdrawPrizePool(1, { from: accounts[1] });
        const gasUsed1 = receipt1.receipt.gasUsed;
        const transaction1 = await web3.eth.getTransaction(receipt1.tx);
        const gasPrice1 = transaction1.gasPrice;
        const gasExpenses1 = new BN(gasUsed1).mul(new BN(gasPrice1));

        const winnerExpectedBalance1 = new BN(originalBalance1).sub(gasExpenses1).add(originalPrizePool.div(new BN(2)));
        const winnerBalance1 = await web3.eth.getBalance(accounts[1]);
        assert.equal(winnerBalance1, winnerExpectedBalance1.toString(), 'winner has the correct balance');

        let expectedSmartContractBalance = new BN(originalSmartContractBalance)
            .add(new BN(donation).mul(new BN(prizePoolFee)).div(new BN(100)))
            .add(new BN(originalPrizePool).div(new BN(2)));
        let smartContractBalance = await web3.eth.getBalance(instance.address);
        assert.equal(
            smartContractBalance,
            expectedSmartContractBalance.toString(),
            'smart contract has the correct balance'
        );

        // Winner 2 withdrawing
        const originalBalance2 = await web3.eth.getBalance(accounts[2]);

        const receipt2 = await instance.withdrawPrizePool(2, { from: accounts[2] });
        const gasUsed2 = receipt2.receipt.gasUsed;
        const transaction2 = await web3.eth.getTransaction(receipt2.tx);
        const gasPrice2 = transaction2.gasPrice;
        const gasExpenses2 = new BN(gasUsed2).mul(new BN(gasPrice2));

        const winnerExpectedBalance2 = new BN(originalBalance2).sub(gasExpenses2).add(originalPrizePool.div(new BN(2)));
        const winnerBalance2 = await web3.eth.getBalance(accounts[2]);
        assert.equal(winnerBalance2, winnerExpectedBalance2.toString(), 'winner has the correct balance');

        expectedSmartContractBalance = new BN(originalSmartContractBalance).add(
            new BN(donation).mul(new BN(prizePoolFee)).div(new BN(100))
        );
        smartContractBalance = await web3.eth.getBalance(instance.address);
        assert.equal(
            smartContractBalance,
            expectedSmartContractBalance.toString(),
            'smart contract has the correct balance'
        );
    });

    it('Multiple winners can withdraw parts of the prize pool', async () => {
        const oneEther = web3.utils.toWei('7', 'ether');
        const prizePoolFee = 1; // in percents
        const futureDueDate = Math.round(new Date().getTime() / 1000) + 10000;
        const instance = await Campaign.new(accounts[9], 'Campaign1', futureDueDate, 5, prizePoolFee, 100, oneEther);
        const originalSmartContractBalance = await web3.eth.getBalance(instance.address);

        await instance.addCandidate('Candidate1', accounts[1], { from: accounts[0] });
        await instance.addCandidate('Candidate2', accounts[2], { from: accounts[0] });
        await instance.addCandidate('Candidate4', accounts[3], { from: accounts[0] });
        await instance.addCandidate('Candidate3', accounts[4], { from: accounts[0] });
        await instance.vote(1, { from: accounts[1] });
        await instance.vote(2, { from: accounts[2] });
        await instance.vote(3, { from: accounts[3] });

        const donation = oneEther;
        await web3.eth.sendTransaction({ from: accounts[0], to: instance.address, value: donation });
        await instance.setDueDate(12345, { from: accounts[9] });

        const originalPrizePool = await instance.prizePool();

        for (let i = 1; i <= 3; i++) {
            const originalBalance = await web3.eth.getBalance(accounts[i]);

            const receipt = await instance.withdrawPrizePool(i, { from: accounts[i] });
            const gasUsed = receipt.receipt.gasUsed;
            const transaction = await web3.eth.getTransaction(receipt.tx);
            const gasPrice = transaction.gasPrice;
            const gasExpenses = new BN(gasUsed).mul(new BN(gasPrice));

            const winnerExpectedBalance = new BN(originalBalance)
                .sub(gasExpenses)
                .add(originalPrizePool.div(new BN(3)));
            const winnerBalance = await web3.eth.getBalance(accounts[i]);
            assert.equal(winnerBalance, winnerExpectedBalance.toString(), 'winner has the correct balance');

            let expectedSmartContractBalance = new BN(originalSmartContractBalance)
                .add(new BN(donation).mul(new BN(prizePoolFee)).div(new BN(100)))
                .add(new BN(originalPrizePool).div(new BN(3)).mul(new BN(3 - i)));
            let smartContractBalance = await web3.eth.getBalance(instance.address);
            assert.equal(
                smartContractBalance,
                expectedSmartContractBalance.toString(),
                'smart contract has the correct balance'
            );
        }
    });

    it('Cannot withdraw when elections are not finished', async () => {
        const oneEther = web3.utils.toWei('1', 'ether');
        const prizePoolFee = 1; //in percents
        const dueDate = Math.round(new Date().getTime() / 1000) + 10000;

        const instance = await Campaign.new(accounts[9], 'Campaign1', dueDate, 5, prizePoolFee, 100, oneEther);
        const originalSmartContractBalance = await web3.eth.getBalance(instance.address);

        await instance.addCandidate('Candidate1', accounts[1], { from: accounts[0] });
        await instance.vote(1, { from: accounts[0] });
        await web3.eth.sendTransaction({ from: accounts[0], to: instance.address, value: oneEther });

        try {
            await instance.withdrawPrizePool(1, { from: accounts[1] });
            assert.fail;
        } catch (error) {
            assert(error.message.indexOf('revert') >= 0, 'error message must contain revert');
        }

        const prizePool = await instance.prizePool();
        const expectedPrizePool = new BN(oneEther).mul(new BN(100 - prizePoolFee)).div(new BN(100));
        assert.equal(prizePool, expectedPrizePool.toString(), 'prize pool must have correct balance');

        const smartContractBalance = await web3.eth.getBalance(instance.address);
        const expectedBalance = new BN(originalSmartContractBalance).add(new BN(oneEther));
        assert.equal(smartContractBalance, expectedBalance.toString(), 'smart contract must have correct balance');
    });

    it('Cannot withdraw when there are no candidates', async () => {
        const oneEther = web3.utils.toWei('1', 'ether');
        const prizePoolFee = 1; //in percents

        const instance = await Campaign.new(accounts[9], 'Campaign1', 12345, 5, prizePoolFee, 100, oneEther);
        const originalSmartContractBalance = await web3.eth.getBalance(instance.address);

        await web3.eth.sendTransaction({ from: accounts[0], to: instance.address, value: oneEther });

        try {
            await instance.withdrawPrizePool(1, { from: accounts[1] });
            assert.fail;
        } catch (error) {
            assert(error.message.indexOf('revert') >= 0, 'error message must contain revert');
        }

        const prizePool = await instance.prizePool();
        const expectedPrizePool = new BN(oneEther).mul(new BN(100 - prizePoolFee)).div(new BN(100));
        assert.equal(prizePool, expectedPrizePool.toString(), 'prize pool must have correct balance');

        const smartContractBalance = await web3.eth.getBalance(instance.address);
        const expectedBalance = new BN(originalSmartContractBalance).add(new BN(oneEther));
        assert.equal(smartContractBalance, expectedBalance.toString(), 'smart contract must have correct balance');
    });

    it('Cannot withdraw empty prize pool', async () => {
        const dueDate = Math.round(new Date().getTime() / 1000) + 10000;
        const instance = await Campaign.new(accounts[9], 'Campaign1', dueDate, 5, 1, 100, 1000);

        await instance.addCandidate('Candidate1', accounts[1], { from: accounts[0] });
        await instance.vote(1, { from: accounts[0] });

        await instance.setDueDate(12345, { from: accounts[9] });

        let prizePool = await instance.prizePool();
        assert.equal(prizePool, 0, 'prize pool must have correct balance');

        try {
            await instance.withdrawPrizePool(1, { from: accounts[1] });
            assert.fail;
        } catch (error) {
            assert(error.message.indexOf('revert') >= 0, 'error message must contain revert');
        }

        prizePool = await instance.prizePool();
        assert.equal(prizePool, 0, 'prize pool must have correct balance');
    });

    it('Cannot withdraw by not being a winner', async () => {
        const oneEther = web3.utils.toWei('1', 'ether');
        const prizePoolFee = 1; //in percents
        const dueDate = Math.round(new Date().getTime() / 1000) + 10000;

        const instance = await Campaign.new(accounts[9], 'Campaign1', dueDate, 5, prizePoolFee, 100, oneEther);
        const originalSmartContractBalance = await web3.eth.getBalance(instance.address);

        await web3.eth.sendTransaction({ from: accounts[0], to: instance.address, value: oneEther });

        await instance.addCandidate('Candidate1', accounts[1], { from: accounts[0] });
        await instance.vote(1, { from: accounts[0] });
        await instance.vote(1, { from: accounts[3] });
        await instance.addCandidate('Candidate2', accounts[2], { from: accounts[3] });
        await instance.vote(2, { from: accounts[4] });

        await instance.setDueDate(12345, { from: accounts[9] });

        try {
            await instance.withdrawPrizePool(2, { from: accounts[2] });
            assert.fail;
        } catch (error) {
            assert(error.message.indexOf('revert') >= 0, 'error message must contain revert');
        }

        const prizePool = await instance.prizePool();
        const expectedPrizePool = new BN(oneEther).mul(new BN(100 - prizePoolFee)).div(new BN(100));
        assert.equal(prizePool, expectedPrizePool.toString(), 'prize pool must have correct balance');

        const smartContractBalance = await web3.eth.getBalance(instance.address);
        const expectedBalance = new BN(originalSmartContractBalance).add(new BN(oneEther));
        assert.equal(smartContractBalance, expectedBalance.toString(), 'smart contract must have correct balance');
    });

    it('Cannot withdraw by passing wrong candidate id', async () => {
        const oneEther = web3.utils.toWei('1', 'ether');
        const prizePoolFee = 1; //in percents
        const dueDate = Math.round(new Date().getTime() / 1000) + 10000;

        const instance = await Campaign.new(accounts[9], 'Campaign1', dueDate, 5, prizePoolFee, 100, oneEther);
        const originalSmartContractBalance = await web3.eth.getBalance(instance.address);

        await web3.eth.sendTransaction({ from: accounts[0], to: instance.address, value: oneEther });

        await instance.addCandidate('Candidate1', accounts[1], { from: accounts[0] });
        await instance.vote(1, { from: accounts[0] });
        await instance.vote(1, { from: accounts[3] });
        await instance.addCandidate('Candidate2', accounts[2], { from: accounts[3] });

        await instance.setDueDate(12345, { from: accounts[9] });

        try {
            await instance.withdrawPrizePool(1, { from: accounts[2] });
            assert.fail;
        } catch (error) {
            assert(error.message.indexOf('revert') >= 0, 'error message must contain revert');
        }

        const prizePool = await instance.prizePool();
        const expectedPrizePool = new BN(oneEther).mul(new BN(100 - prizePoolFee)).div(new BN(100));
        assert.equal(prizePool, expectedPrizePool.toString(), 'prize pool must have correct balance');

        const smartContractBalance = await web3.eth.getBalance(instance.address);
        const expectedBalance = new BN(originalSmartContractBalance).add(new BN(oneEther));
        assert.equal(smartContractBalance, expectedBalance.toString(), 'smart contract must have correct balance');
    });

    it('Winner cannot withdraw prize pool twice', async () => {
        const oneEther = web3.utils.toWei('1', 'ether');
        const prizePoolFee = 1; // in percents
        const futureDueDate = Math.round(new Date().getTime() / 1000) + 10000;
        const instance = await Campaign.new(accounts[9], 'Campaign1', futureDueDate, 5, prizePoolFee, 100, oneEther);
        const originalSmartContractBalance = await web3.eth.getBalance(instance.address);

        await instance.addCandidate('Candidate1', accounts[1], { from: accounts[0] });
        await instance.addCandidate('Candidate2', accounts[2], { from: accounts[0] });
        await instance.vote(1, { from: accounts[0] });

        const donation = oneEther;
        await web3.eth.sendTransaction({ from: accounts[0], to: instance.address, value: donation });
        await instance.setDueDate(12345, { from: accounts[9] });

        const prizePool = await instance.prizePool();
        const originalBalance = await web3.eth.getBalance(accounts[1]);

        const receipt = await instance.withdrawPrizePool(1, { from: accounts[1] });
        const gasUsed = receipt.receipt.gasUsed;
        const transaction = await web3.eth.getTransaction(receipt.tx);
        const gasPrice = transaction.gasPrice;
        const gasExpenses = new BN(gasUsed).mul(new BN(gasPrice));

        let gasExpenseForFailedTransaction = 0;
        try {
            await instance.withdrawPrizePool(1, { from: accounts[1] });
            assert.fail;
        } catch (error) {
            assert(error.message.indexOf('revert') >= 0, 'error message must contain revert');

            const transactionHash = Object.keys(error.data)[0];
            const failedTransaction = await web3.eth.getTransaction(transactionHash);

            const gasUsedForFailedTr = failedTransaction.gas;
            const gasPriceForFailedTr = failedTransaction.gasPrice;
            gasExpenseForFailedTransaction = new BN(gasUsedForFailedTr).mul(new BN(gasPriceForFailedTr));
            assert(gasExpenseForFailedTransaction > 0, 'There was gas spent for the failed transaction');
        }

        const winnerMinExpectedBalance = new BN(originalBalance)
            .sub(gasExpenses)
            .sub(gasExpenseForFailedTransaction)
            .add(prizePool);
        const winnerMaxExpectedBalance = new BN(originalBalance).sub(gasExpenses).add(prizePool);
        let winnerBalance = await web3.eth.getBalance(accounts[1]);
        winnerBalance = new BN(winnerBalance);
        assert(
            winnerBalance.gte(winnerMinExpectedBalance) && winnerBalance.lte(winnerMaxExpectedBalance),
            'winner has the correct balance'
        );

        const expectedSmartContractBalance = new BN(originalSmartContractBalance).add(
            new BN(donation).mul(new BN(prizePoolFee)).div(new BN(100))
        );
        const smartContractBalance = await web3.eth.getBalance(instance.address);
        assert.equal(
            smartContractBalance,
            expectedSmartContractBalance.toString(),
            'smart contract has the correct balance'
        );
    });
});
