
import * as helperService from "./helperService";
const EthereumTx = require("ethereumjs-tx");

export const sendTransaction = async (
    networkId: string,
    fromPrivate: string,
    toAddress: string,
    amount: number
): Promise<any> => {
    const web3 = helperService.getWeb3Instance(networkId);

    try {
        var fromAccount = await web3.eth.accounts.privateKeyToAccount(fromPrivate);

        /**
         * With every new transaction you send using a specific wallet address,
         * you need to increase a nonce which is tied to the sender wallet.
         */
        let nonce = await web3.eth.getTransactionCount(fromAccount.address);
        const gasprice = await web3.eth.getGasPrice();
        var txObject = {
            to: toAddress,
            value: web3.utils.toHex(web3.utils.toWei(amount.toString(), "ether")),
            gas: web3.utils.toHex(23000),
            gasPrice: gasprice,
            nonce: web3.utils.toHex(nonce),
        };

        const transaction = new EthereumTx(txObject);

        /**
         * This is where the transaction is authorized on your behalf.
         * The private key is what unlocks your wallet.
         */
        transaction.sign(Buffer.from(fromPrivate, "hex"));

        // Now, we'll compress the transaction info down into a transportable object.
        const serializedTransaction = transaction.serialize();

        // We're ready! Submit the raw transaction details to the provider configured above.
        return await web3.eth
            .sendSignedTransaction("0x" + serializedTransaction.toString("hex"))
            .on("transactionHash", function (hash) {
                return {
                    success: true,
                    message: hash != undefined ? hash.transactionHash : 'Insufficient balance',
                };
            })
            .on("error", function (msg) {
                console.log(`error`, msg);
                return {
                    success: false,
                    message: "Insufficient balance",
                };
            });
    } catch (error) {
        console.log(error);
        return {
            success: false,
            message: "Insufficient balance",
        };
    }
};