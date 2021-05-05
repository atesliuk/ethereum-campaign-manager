import React from 'react';
import { useState, useEffect } from 'react';
import CampaignContract from '../contracts/Campaign.json';
import { toTime, toEther } from '../Utils';
import { useParams } from 'react-router-dom';
import { Form, Col, Button } from 'react-bootstrap';

import '../App.css';

function Campaign({ web3, currentAddress }) {
    const { campaignAddress } = useParams();
    const [campaignContract, setCampaignContract] = useState();
    const [campaignData, setCampaignData] = useState({});
    const [candidates, setCandidates] = useState({});
    const [voted, setVoted] = useState(false);
    const [candidatesRows, setCandidatesRows] = useState([]);
    const [donation, setDonation] = useState([]);
    const [alert, setAlert] = useState();

    useEffect(() => {
        if (web3 && currentAddress && campaignAddress) {
            const campaignContract = new web3.eth.Contract(CampaignContract.abi, campaignAddress);
            setCampaignContract(campaignContract);
        }
    }, [web3, currentAddress]);

    useEffect(() => {
        if (campaignContract) {
            getContractData();
        }
    }, [campaignContract]);

    const getContractData = async () => {
        const name = await campaignContract.methods.name().call();
        const dueDate = await campaignContract.methods.dueDate().call();
        const donationFee = await campaignContract.methods.donationFee().call();
        const prizePoolFee = await campaignContract.methods.prizePoolFee().call();
        const minDonation = await campaignContract.methods.minDonation().call();
        const maxDonation = await campaignContract.methods.maxDonation().call();
        const prizePool = await campaignContract.methods.prizePool().call();
        const owner = await campaignContract.methods.owner().call();
        const candidatesCount = await campaignContract.methods.candidatesCount().call();

        const voted = await campaignContract.methods.voted(currentAddress).call();
        setVoted(voted);

        const campaignData = {
            name,
            dueDate,
            donationFee,
            prizePoolFee,
            minDonation,
            maxDonation,
            prizePool,
            owner,
            candidatesCount,
        };

        setCampaignData({ ...campaignData });
    };

    useEffect(() => {
        setCandidates({});
        if (campaignData && campaignData.candidatesCount > 0) {
            for (let i = 1; i <= campaignData.candidatesCount; i++) {
                getCandidate(i);
            }
        }
    }, [campaignData]);

    const getCandidate = async candidateNr => {
        const candidate = await campaignContract.methods.candidates(candidateNr).call();
        candidates['candidate' + candidateNr] = candidate;
        setCandidates({ ...candidates });
    };

    useEffect(() => {
        if (candidates && Object.keys(candidates).length > 0) {
            generateCandidateRows();
        }
    }, [candidates]);

    const generateCandidateRows = () => {
        const rows = [];
        for (let i = 1; i <= campaignData.candidatesCount; i++) {
            const candidate = candidates['candidate' + i];

            let row;

            if (candidate) {
                row = (
                    <tr key={'row-' + i}>
                        <th scope="row">{i}</th>
                        <td>{candidate.name}</td>
                        <td>{candidate.voteCount}</td>
                        <td>{candidate.isActive ? 'Active' : 'Inactive'}</td>
                        <td>{candidate.accountAddress}</td>
                        <td>{candidate.nominator}</td>
                        {voted && candidate.isActive ? (
                            <></>
                        ) : (
                            <td>
                                <Button onClick={() => vote(i)}>Vote</Button>
                            </td>
                        )}
                        {candidate.nominator === currentAddress ? (
                            <td>
                                <Button onClick={() => edit(candidate)}>Edit</Button>
                            </td>
                        ) : (
                            <></>
                        )}
                    </tr>
                );
            } else {
                row = (
                    <tr key={'row-' + i}>
                        <th scope="row">{i}</th>
                        <td>...</td>
                        <td>...</td>
                        <td>...</td>
                        <td>...</td>
                        <td>...</td>
                        <td>...</td>
                    </tr>
                );
            }

            rows.push(row);
        }
        setCandidatesRows(rows);
    };

    const vote = async candidateNr => {
        try {
            await campaignContract.methods.vote(candidateNr).send({ from: currentAddress });
            getContractData();
        } catch (error) {
            console.error('Something went wrong:');
            console.error(error);
        }
    };

    const edit = candidate => {
        // Will implement later
    };

    const handleChange = event => {
        setDonation(event.target.value);
    };

    const donate = async () => {
        if (donation > 0) {
            try {
                await web3.eth.sendTransaction({
                    from: currentAddress,
                    to: campaignAddress,
                    value: web3.utils.toWei(donation, 'ether'),
                });
                getContractData();
                setAlert(`Your donation of ${donation} ETH was received!`);
                setDonation('');
            } catch (error) {
                setAlert(`Something went wrong, try again later`);
                console.error('Something went wrong');
                console.error(error);
            }
        }
    };

    return (
        <div className="pl-3">
            <h1>Campaign data</h1>
            <p>
                Name: {campaignData.name}
                <br></br>
                Due date: {toTime(campaignData.dueDate)}
                <br></br>
                Donation fee: {campaignData.donationFee}%<br></br>
                Prize pool fee: {campaignData.prizePoolFee} ETH
                <br></br>
                Minimal donation: {toEther(web3, campaignData.minDonation)} ETH
                <br></br>
                Maximal donation: {toEther(web3, campaignData.maxDonation)} ETH
                <br></br>
                Current prize pool: {toEther(web3, campaignData.prizePool)} ETH
                <br></br>
                Creator: <i> {campaignData.owner}</i>
            </p>

            <Form>
                <Form.Row className="align-items-center">
                    <Col xs="auto" className="my-1">
                        <Form.Control
                            id="donation"
                            value={donation}
                            placeholder="Your donation (in Eth)"
                            onChange={handleChange}
                        />
                    </Col>
                    <Col xs="auto" className="my-1">
                        <Button className="btn-success" onClick={() => donate()}>
                            Donate
                        </Button>
                    </Col>
                </Form.Row>
            </Form>
            {alert ? (
                <p>
                    <i>{alert}</i>
                </p>
            ) : (
                <></>
            )}
            <br></br>
            <p>
                <b>{voted ? 'You already voted!' : 'You have not voted yet'}</b>
            </p>
            <br></br>
            <h2>Candidates ({campaignData.candidatesCount})</h2>
            <table className="table center">
                <thead>
                    <tr>
                        <th scope="col">#</th>
                        <th scope="col">Name</th>
                        <th scope="col">Vote count</th>
                        <th scope="col">Status</th>
                        <th scope="col">Address</th>
                        <th scope="col">Nominated by</th>
                    </tr>
                </thead>
                <tbody>{candidatesRows}</tbody>
            </table>
        </div>
    );
}

export default Campaign;
