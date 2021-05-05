exports.toEther = (web3, num) => {
    return web3 ? web3.utils.fromWei(new web3.utils.BN(num), 'ether') : '';
};

exports.toTime = unixTime => {
    if (!unixTime) {
        return '';
    }
    const date = new Date(unixTime * 1000);
    const hours = date.getHours();
    const minutes = '0' + date.getMinutes();
    const seconds = '0' + date.getSeconds();

    const formattedDate =
        date.toLocaleDateString('en-UK') + ' ' + hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);

    return formattedDate;
};

exports.CAMPAIGN_MANAGER_ADDRESS = '0x7074164bedc7d5bde0ed4e4f7c27731bb49be934';
