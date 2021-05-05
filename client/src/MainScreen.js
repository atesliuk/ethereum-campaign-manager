import React from 'react';
import { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import CampaignManagerContract from './contracts/CampaignManager.json';
import CampaignContract from './contracts/Campaign.json';
import { CAMPAIGN_MANAGER_ADDRESS, toEther, toTime } from './Utils';
import { Button } from 'react-bootstrap';

import './App.css';

function MainScreen({ web3, currentAddress }) {
    const history = useHistory();

    // Campaign manager
    const [campaignManager, setCampaignManager] = useState();
    const [campaignManagerFee, setCampaignManagerFee] = useState(0);

    // Campaigns
    const [campaignsCount, setCampaignsCount] = useState(0);
    const [campaigns, setCampaigns] = useState({});
    const [campaignsRows, setCampaignsRows] = useState([]);

    useEffect(() => {
        if (web3) {
            const campaignManager = new web3.eth.Contract(CampaignManagerContract.abi, CAMPAIGN_MANAGER_ADDRESS);
            setCampaignManager(campaignManager);
        }
    }, [web3, currentAddress]);

    useEffect(() => {
        if (campaignManager) {
            getCampaignManagerFee();
            getCampaignsCount();
        }
    }, [campaignManager]);

    const getCampaignManagerFee = async () => {
        const fee = await campaignManager.methods.fee().call();
        setCampaignManagerFee(fee);
    };

    const getCampaignsCount = async () => {
        const count = await campaignManager.methods.campaignsCount().call();
        setCampaignsCount(count);
    };

    useEffect(() => {
        if (campaignsCount > 0) {
            setCampaigns({});
            for (let i = 0; i < campaignsCount; i++) {
                getCampaign(i);
            }
        }
    }, [campaignsCount]);

    const getCampaign = async campaignNum => {
        const campaignAddress = await campaignManager.methods.campaigns(campaignNum).call();
        const campaign = new web3.eth.Contract(CampaignContract.abi, campaignAddress);

        const name = await campaign.methods.name().call();
        const dueDate = await campaign.methods.dueDate().call();
        const donationFee = await campaign.methods.donationFee().call();
        const prizePoolFee = await campaign.methods.prizePoolFee().call();
        const minDonation = await campaign.methods.minDonation().call();
        const maxDonation = await campaign.methods.maxDonation().call();
        const prizePool = await campaign.methods.prizePool().call();
        const owner = await campaign.methods.owner().call();

        const campaignData = {
            contract: campaign,
            name,
            dueDate,
            donationFee,
            prizePoolFee,
            minDonation,
            maxDonation,
            prizePool,
            owner,
            address: campaignAddress,
        };

        campaigns[campaignNum] = campaignData;
        setCampaigns({ ...campaigns });
    };

    useEffect(() => {
        if (campaigns) {
            const rows = [];
            for (let i = 0; i < campaignsCount; i++) {
                rows.push(generateCampaignRow(i));
            }
            setCampaignsRows(rows.map(r => r));
        }
    }, [campaigns]);

    const generateCampaignRow = num => {
        const campaignData = campaigns[num];
        if (campaignData) {
            return (
                <tr key={'row-' + num}>
                    <th scope="row">{num + 1}</th>
                    <td>{campaignData.name}</td>
                    <td>{toTime(campaignData.dueDate)}</td>
                    <td>{campaignData.donationFee}%</td>
                    <td>{campaignData.prizePoolFee}%</td>
                    <td>{toEther(web3, campaignData.minDonation)}</td>
                    <td>{toEther(web3, campaignData.maxDonation)}</td>
                    <td>{toEther(web3, campaignData.prizePool)}</td>
                    <td>
                        <Button onClick={() => viewCampaign(num)}>Details</Button>
                    </td>
                    {campaignData.owner === currentAddress ? (
                        <td>
                            <Button className="btn-warning" onClick={() => editCampaign(num)}>
                                Edit
                            </Button>
                        </td>
                    ) : (
                        <> </>
                    )}
                </tr>
            );
        }
        return (
            <tr key={'row-' + num}>
                <th scope="row">{num + 1}</th>
                <td>...</td>
                <td>...</td>
                <td>...</td>
                <td>...</td>
                <td>...</td>
                <td>...</td>
                <td>...</td>
            </tr>
        );
    };

    const viewCampaign = campaignNr => {
        history.push('/campaigns/' + campaigns[campaignNr].address);
    };
    const editCampaign = campaignNum => {
        // will implement later
    };

    return (
        <div className="App">
            <h1>Welcome To Campaign Manager</h1>
            <div>
                Your account: <i>{currentAddress}</i>
            </div>
            <br></br>
            <p>
                <i>Campaign manager fee: {toEther(web3, campaignManagerFee)} ETH</i>
            </p>
            <p>
                <Button className="btn-success">Create Campaign</Button>
            </p>
            <br></br>
            <p>
                Campaigns created so far: <b>{campaignsCount}</b>
            </p>
            <table className="table center">
                <thead>
                    <tr>
                        <th scope="col">#</th>
                        <th scope="col">Name</th>
                        <th scope="col">Due date</th>
                        <th scope="col">Donation fee</th>
                        <th scope="col">Prize pool fee</th>
                        <th scope="col">Min donation (ETH)</th>
                        <th scope="col">Max donation (ETH)</th>
                        <th scope="col">Current prize pool (ETH)</th>
                    </tr>
                </thead>
                <tbody>{campaignsRows}</tbody>
            </table>
        </div>
    );
}

export default MainScreen;
