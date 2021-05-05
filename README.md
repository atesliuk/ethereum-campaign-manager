# Description

**CampaignManager** is a smart contract that allows you to create blockchain-based elections with functionality of voting and donating to specific candidates, as well as to the general prize pool.

**CampaignManager** smart contract contains the following information:

-   fee (in wei) - fee that a user should provide in order to create a campaign
-   campaign count - number of campaigns that were created
-   Campaigns - array of the created campaigns

Fee can be changed by the owner (creator) of the **CampaignManager** smart contract

Currently **CampaignManager** smart contract is deployed to the Ropsten Test Network. It has the following address:
`0x7074164BedC7D5BDe0ed4E4f7C27731bb49bE934`

or check it on [Etherscan](https://ropsten.etherscan.io/address/0x7074164BedC7D5BDe0ed4E4f7C27731bb49bE934)

---

<br>

## Campaign

**Campaign** is a smart contract that gets created by the **CampaignManager** smart contract based on the following information:

-   name - name of the campaign/elections
-   due date - date (in unix timestamp) when the elections will be over
-   donation fee (in %) - percentage of donations to candidates that will be retained as a fee
-   Prize pool fee (in %) - percentage of the prize pool that will be retained as a fee
-   Minimal donation - minimal amount that can be donated to a candidate
-   Maxumal amount - maximal (cumulative) amount that can be donated to a candidate

**Owner of the Campaign smart contract can change those variables at any time**

**Even though the Campaign smart contract gets created by the CampaignManager, the owner of the created Campaign smart contract is the user who has initiated the transaction to create that specific Campaign smart contract. Therefore, once Campaign smart contract is created, only the owner can make changes in it!**
<br>
<br>

Regular users can interract with the **Campaign** smart contracts in the following way:

-   Add a candidate (candidate's name and ethereum address should be provided)
-   Change name and ethereum address of the candidate
-   Change activity status of the candidate (enable or disable a candidate)
-   Vote for a candidate (only for one candidate)
-   Donate to a candidate
-   Donate to a prize pool

<br>
Once elections are over,

-   Winner (a candidate with the largest number of votes) can withdraw the prize pool
-   If there are multiple winners, prize pool is splitted evenly

When elections are over, it is not possible to:

-   Vote for candidates
-   Add new candidates
-   Change status of candidates

<br>

Also,

-   Users cannot vote for inactive candidates, as well as cannot donate to them
-   Inactive candidates cannot withdraw the prize pool even if they have the largest amount of votes

---

<br>

# Frontend

Client side of the application is in the development process and is not finished yet. The client side is mainly based on React javascript framework
