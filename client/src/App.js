import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { useState, useEffect } from 'react';
import getWeb3 from './getWeb3';

import './App.css';
import MainScreen from './MainScreen';
import Campaign from './Campaign/Campaign';

function App() {
    const [web3, setWeb3] = useState();
    const [currentAddress, setCurrentAddress] = useState();

    useEffect(() => {
        initWeb3();
    }, []);

    const initWeb3 = async () => {
        try {
            const web3 = await getWeb3();
            setWeb3(web3);

            const accounts = await web3.eth.getAccounts();
            setCurrentAddress(accounts[0]);
        } catch (error) {
            console.err(`Failed to load web3, accounts, or contract. Check console for details.`);
            console.error(error);
        }
    };

    return (
        <div>
            {web3 ? (
                <Router>
                    <Switch>
                        <Route path="/campaigns/:campaignAddress">
                            <Campaign web3={web3} currentAddress={currentAddress} />
                        </Route>
                        <Route path="/">
                            <MainScreen web3={web3} currentAddress={currentAddress} />
                        </Route>
                    </Switch>
                </Router>
            ) : (
                <div>Loading Web3, accounts, and contract...</div>
            )}
        </div>
    );
}

export default App;
