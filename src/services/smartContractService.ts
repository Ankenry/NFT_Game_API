import path from "path";
import * as envConfig from "../env-config.json";

const solc = require("solc");
const fs = require("fs");
const Web3 = require("web3");
const web3 = new Web3(envConfig.polygonNetwork.rpc);

async function readFile(filePath: string) {
    const fsPromises = require("fs").promises;
    const data = await fsPromises
        .readFile(filePath)
        .catch((err) => console.error("Failed to read file", err));

    return data.toString();
}

async function writeFile(fileName: string, fileContent: string) {
    const fsPromises = require("fs").promises;
        const data = await fsPromises
        .writeFile(fileName, fileContent)
        .catch((err) => console.error("Failed to write file", err));
}

function findImports(relativePath) {
    const absolutePath = path.resolve(process.cwd(), 'node_modules', relativePath);
    const source = fs.readFileSync(absolutePath, 'utf8');
    return { contents: source };
}

export const deploySmartContract = async (
    fromPrivate: string,
    tokenName: string,
    tokenSymbol: string
): Promise<any> => {
    try {
        try {
            var templatePath = path.resolve('src', 'nft-contract-template.sol');
            var content = await readFile(templatePath);
            content = content.replace("TOKEN_NAME", tokenName);
            content = content.replace("TOKEN_SYMBOL", tokenSymbol);

            var input = {
                language: "Solidity",
                sources: {
                    "fileData.sol": {
                        content: content,
                    },
                },
                settings: {
                    outputSelection: {
                        "*": {
                            "*": ["*"],
                        },
                    },
                },
            };

            var compiled = solc.compile(JSON.stringify(input), { import: findImports });
            var output = JSON.parse(compiled);

            var abi = output.contracts["fileData.sol"]["GesotenNft"].abi;
            var bytecode = output.contracts["fileData.sol"]["GesotenNft"].evm.bytecode.object;

            let deployContract = new web3.eth.Contract(abi);
            var fromAccount = await web3.eth.accounts.privateKeyToAccount(
                fromPrivate
            );
            await web3.eth.accounts.wallet.add(fromPrivate);

            let parameter = {
                from: fromAccount.address,
                gas: web3.utils.toHex(5300000),
                gasPrice: web3.utils.toHex(await web3.eth.getGasPrice()),
            };

            var contract = await deployContract
                .deploy({
                    data: bytecode,
                })
                .send(parameter, (err, transactionHash) => {
                    web3.eth.accounts.wallet.remove(fromPrivate);
                    return transactionHash;
                })
                .on("confirmation", () => { })
                .then((newContractInstance) => {
                    console.log(
                        "Deployed Contract Address : ",
                        newContractInstance.options.address
                    );

                    return newContractInstance.options.address;
                });

            if (contract != undefined && contract != "") {
                const abiCodesPath = path.resolve(process.cwd(), 'abi-codes');
                if (!fs.existsSync(abiCodesPath)){
                    fs.mkdirSync(abiCodesPath);
                }

                await writeFile(
                    path.resolve('abi-codes', `${tokenSymbol}_${contract}_abi.json`),
                    JSON.stringify(abi)
                );
                await writeFile(
                    path.resolve('abi-codes', `${tokenSymbol}_${contract}_code.json`),
                    content
                );
            }

            return {
                success: true,
                message: "Deploy NFT smart contract success",
                smartContractAddress: contract,
            };
        } catch (error) {
            return {
                success: false,
                message: `${error}`,
            };
        }
    } catch (error) {
        console.log(error);
        return {
            success: false,
            message: error,
        };
    }
};