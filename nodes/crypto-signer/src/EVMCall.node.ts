import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';
import { ethers } from 'ethers';
import { CHAIN_CONFIGS } from './chainConfig';

const PREDEFINED_FUNCTIONS = {
	balanceOf: {
		name: 'balanceOf',
		signature: 'balanceOf(address)',
		description: 'Get token balance of an address',
		parameters: ['address'],
		isView: true,
	},
	transfer: {
		name: 'transfer',
		signature: 'transfer(address,uint256)',
		description: 'Transfer tokens to another address',
		parameters: ['address', 'uint256'],
		isView: false,
	},
	transferWithAuthorization: {
		name: 'transferWithAuthorization',
		signature: 'transferWithAuthorization(address,address,uint256,uint256,uint256,bytes32,uint8,bytes32,bytes32)',
		description: 'Transfer tokens with authorization signature',
		parameters: ['address', 'address', 'uint256', 'uint256', 'uint256', 'bytes32', 'uint8', 'bytes32', 'bytes32'],
		isView: false,
	},
};

export class EVMCall implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'EVM Call',
		name: 'evmCall',
		icon: 'file:evm-call.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Make EVM calls and send transactions to smart contracts',
		defaults: {
			name: 'EVM Call',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'evmPrivateKey',
				required: false,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Read Call',
						value: 'read',
						action: 'Make a read-only call',
						description: 'Execute a view/pure function without sending a transaction',
					},
					{
						name: 'Send Transaction',
						value: 'transaction',
						action: 'Send a transaction',
						description: 'Execute a state-changing function that requires gas',
					},
				],
				default: 'read',
			},
			{
				displayName: 'Blockchain',
				name: 'blockchain',
				type: 'options',
				options: [
					...CHAIN_CONFIGS.map(chain => ({
						name: chain.name,
						value: chain.chainId.toString(),
					})),
					{
						name: 'Custom RPC',
						value: 'custom',
					},
				],
				default: '1',
				description: 'Select the blockchain network',
			},
			{
				displayName: 'Custom RPC URL',
				name: 'customRpcUrl',
				type: 'string',
				displayOptions: {
					show: {
						blockchain: ['custom'],
					},
				},
				default: '',
				required: true,
				description: 'Custom RPC endpoint URL',
			},
			{
				displayName: 'Contract Address',
				name: 'contractAddress',
				type: 'string',
				default: '',
				required: true,
				description: 'The smart contract address to interact with',
			},
			{
				displayName: 'Function',
				name: 'function',
				type: 'options',
				options: [
					{
						name: 'balanceOf',
						value: 'balanceOf',
						description: 'Get token balance of an address',
					},
					{
						name: 'transfer',
						value: 'transfer',
						description: 'Transfer tokens to another address',
					},
					{
						name: 'transferWithAuthorization',
						value: 'transferWithAuthorization',
						description: 'Transfer tokens with authorization signature',
					},
					{
						name: 'Custom',
						value: 'custom',
						description: 'Define a custom function',
					},
				],
				default: 'balanceOf',
				description: 'Select the function to call',
			},
			// balanceOf parameters
			{
				displayName: 'Address',
				name: 'balanceOfAddress',
				type: 'string',
				displayOptions: {
					show: {
						function: ['balanceOf'],
					},
				},
				default: '',
				required: true,
				description: 'The address to check the balance for',
			},
			// transfer parameters
			{
				displayName: 'To Address',
				name: 'transferTo',
				type: 'string',
				displayOptions: {
					show: {
						function: ['transfer'],
					},
				},
				default: '',
				required: true,
				description: 'The address to transfer tokens to',
			},
			{
				displayName: 'Amount',
				name: 'transferAmount',
				type: 'string',
				displayOptions: {
					show: {
						function: ['transfer'],
					},
				},
				default: '0',
				required: true,
				description: 'The amount of tokens to transfer (in wei)',
			},
			// transferWithAuthorization parameters
			{
				displayName: 'From Address',
				name: 'transferFrom',
				type: 'string',
				displayOptions: {
					show: {
						function: ['transferWithAuthorization'],
					},
				},
				default: '',
				required: true,
				description: 'The address transferring tokens',
			},
			{
				displayName: 'To Address',
				name: 'transferToAuth',
				type: 'string',
				displayOptions: {
					show: {
						function: ['transferWithAuthorization'],
					},
				},
				default: '',
				required: true,
				description: 'The address receiving tokens',
			},
			{
				displayName: 'Value',
				name: 'transferValue',
				type: 'string',
				displayOptions: {
					show: {
						function: ['transferWithAuthorization'],
					},
				},
				default: '0',
				required: true,
				description: 'The amount of tokens to transfer (in wei)',
			},
			{
				displayName: 'Valid After',
				name: 'validAfter',
				type: 'number',
				displayOptions: {
					show: {
						function: ['transferWithAuthorization'],
					},
				},
				default: 0,
				required: true,
				description: 'The time after which the authorization is valid (unix timestamp)',
			},
			{
				displayName: 'Valid Before',
				name: 'validBefore',
				type: 'number',
				displayOptions: {
					show: {
						function: ['transferWithAuthorization'],
					},
				},
				default: 0,
				required: true,
				description: 'The time before which the authorization is valid (unix timestamp)',
			},
			{
				displayName: 'Nonce',
				name: 'nonce',
				type: 'string',
				displayOptions: {
					show: {
						function: ['transferWithAuthorization'],
					},
				},
				default: '',
				required: true,
				description: 'A unique nonce for the authorization (32 bytes hex string)',
			},
			{
				displayName: 'V',
				name: 'v',
				type: 'number',
				displayOptions: {
					show: {
						function: ['transferWithAuthorization'],
					},
				},
				default: 0,
				required: true,
				description: 'Recovery ID (0 or 1)',
			},
			{
				displayName: 'R',
				name: 'r',
				type: 'string',
				displayOptions: {
					show: {
						function: ['transferWithAuthorization'],
					},
				},
				default: '',
				required: true,
				description: 'Signature component R (32 bytes hex string)',
			},
			{
				displayName: 'S',
				name: 's',
				type: 'string',
				displayOptions: {
					show: {
						function: ['transferWithAuthorization'],
					},
				},
				default: '',
				required: true,
				description: 'Signature component S (32 bytes hex string)',
			},
			// custom function parameters
			{
				displayName: 'Function ABI',
				name: 'customFunctionAbi',
				type: 'json',
				displayOptions: {
					show: {
						function: ['custom'],
					},
				},
				default: '{\n  "name": "myFunction",\n  "type": "function",\n  "inputs": [\n    {"name": "param1", "type": "uint256"},\n    {"name": "param2", "type": "address"}\n  ],\n  "outputs": [\n    {"name": "result", "type": "bool"}\n  ]\n}',
				description: 'The ABI definition of the custom function',
			},
			{
				displayName: 'Function Parameters',
				name: 'customParameters',
				type: 'json',
				displayOptions: {
					show: {
						function: ['custom'],
					},
				},
				default: '[\n  "1000000000000000000",\n  "0x1234567890123456789012345678901234567890"\n]',
				description: 'The parameters to pass to the function as a JSON array',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;
				const blockchain = this.getNodeParameter('blockchain', i) as string;
				const contractAddress = this.getNodeParameter('contractAddress', i) as string;
				const functionName = this.getNodeParameter('function', i) as string;

				// Validate contract address
				if (!ethers.isAddress(contractAddress)) {
					throw new NodeOperationError(this.getNode(), 'Invalid contract address');
				}

				// Get RPC URL and chain ID
				let rpcUrl: string;
				let chainId: number;

				if (blockchain === 'custom') {
					const customRpcUrl = this.getNodeParameter('customRpcUrl', i) as string;
					if (!customRpcUrl) {
						throw new NodeOperationError(this.getNode(), 'Custom RPC URL is required');
					}
					rpcUrl = customRpcUrl;
					
					// Get chain ID from RPC
					try {
						const provider = new ethers.JsonRpcProvider(rpcUrl);
						const network = await provider.getNetwork();
						chainId = Number(network.chainId);
					} catch (error) {
						throw new NodeOperationError(this.getNode(), `Failed to get chain ID from RPC: ${error instanceof Error ? error.message : String(error)}`);
					}
				} else {
					const chainConfig = CHAIN_CONFIGS.find(chain => chain.chainId.toString() === blockchain);
					if (!chainConfig) {
						throw new NodeOperationError(this.getNode(), 'Invalid blockchain selection');
					}
					rpcUrl = chainConfig.rpcUrl;
					chainId = chainConfig.chainId;
				}

				// Create provider
				const provider = new ethers.JsonRpcProvider(rpcUrl);

				// Get credentials for transaction operations
				let wallet: ethers.Wallet | undefined;
				if (operation === 'transaction') {
					const credentials = await this.getCredentials('evmPrivateKey');
					
					if (!credentials?.privateKey) {
						throw new NodeOperationError(this.getNode(), 'Private key is required for transactions');
					}

					// Validate and normalize private key
					let privateKey = credentials.privateKey as string;
					privateKey = privateKey.trim();
					if (!privateKey.startsWith('0x')) {
						privateKey = '0x' + privateKey;
					}
					
					if (!/^0x[0-9a-fA-F]{64}$/.test(privateKey)) {
						throw new NodeOperationError(this.getNode(), 'Invalid private key format');
					}

					try {
						wallet = new ethers.Wallet(privateKey, provider);
					} catch (error) {
						throw new NodeOperationError(this.getNode(), `Invalid private key: ${error instanceof Error ? error.message : String(error)}`);
					}
				}

				// Prepare function call
				let functionCall: ethers.ContractMethod;
				let functionAbi: any;
				let parameters: any[];

				if (functionName === 'custom') {
					// Custom function
					const customFunctionAbi = this.getNodeParameter('customFunctionAbi', i) as string;
					const customParameters = this.getNodeParameter('customParameters', i) as string;

					try {
						functionAbi = JSON.parse(customFunctionAbi);
					} catch (error) {
						throw new NodeOperationError(this.getNode(), 'Invalid function ABI JSON');
					}

					try {
						parameters = JSON.parse(customParameters);
					} catch (error) {
						throw new NodeOperationError(this.getNode(), 'Invalid function parameters JSON');
					}

					// Create contract instance
					const contract = new ethers.Contract(contractAddress, [functionAbi], wallet || provider);
					functionCall = contract.getFunction(functionAbi.name);
				} else {
					// Predefined function
					const predefinedFunction = PREDEFINED_FUNCTIONS[functionName as keyof typeof PREDEFINED_FUNCTIONS];
					functionAbi = {
						name: predefinedFunction.name,
						type: 'function',
						inputs: predefinedFunction.parameters.map((param, index) => ({
							name: `param${index}`,
							type: param,
						})),
						outputs: predefinedFunction.isView ? [{ type: 'uint256' }] : [],
						stateMutability: predefinedFunction.isView ? 'view' : 'nonpayable',
					};

					// Get parameters based on function
					parameters = [];
					if (functionName === 'balanceOf') {
						const address = this.getNodeParameter('balanceOfAddress', i) as string;
						if (!ethers.isAddress(address)) {
							throw new NodeOperationError(this.getNode(), 'Invalid address for balanceOf');
						}
						parameters = [address];
					} else if (functionName === 'transfer') {
						const toAddress = this.getNodeParameter('transferTo', i) as string;
						const amount = this.getNodeParameter('transferAmount', i) as string;
						
						if (!ethers.isAddress(toAddress)) {
							throw new NodeOperationError(this.getNode(), 'Invalid to address for transfer');
						}
						if (!/^\d+$/.test(amount)) {
							throw new NodeOperationError(this.getNode(), 'Invalid transfer amount');
						}
						
						parameters = [toAddress, amount];
					} else if (functionName === 'transferWithAuthorization') {
						const fromAddress = this.getNodeParameter('transferFrom', i) as string;
						const toAddress = this.getNodeParameter('transferToAuth', i) as string;
						const value = this.getNodeParameter('transferValue', i) as string;
						const validAfter = this.getNodeParameter('validAfter', i) as number;
						const validBefore = this.getNodeParameter('validBefore', i) as number;
						const nonce = this.getNodeParameter('nonce', i) as string;
						const v = this.getNodeParameter('v', i) as number;
						const r = this.getNodeParameter('r', i) as string;
						const s = this.getNodeParameter('s', i) as string;

						// Validate addresses
						if (!ethers.isAddress(fromAddress)) {
							throw new NodeOperationError(this.getNode(), 'Invalid from address');
						}
						if (!ethers.isAddress(toAddress)) {
							throw new NodeOperationError(this.getNode(), 'Invalid to address');
						}
						if (!/^\d+$/.test(value)) {
							throw new NodeOperationError(this.getNode(), 'Invalid value');
						}

						// Validate nonce format
						let normalizedNonce = nonce.trim();
						if (!normalizedNonce.startsWith('0x')) {
							normalizedNonce = '0x' + normalizedNonce;
						}
						if (!/^0x[0-9a-fA-F]{64}$/.test(normalizedNonce)) {
							throw new NodeOperationError(this.getNode(), 'Invalid nonce format');
						}

						// Validate signature components
						let normalizedR = r.trim();
						if (!normalizedR.startsWith('0x')) {
							normalizedR = '0x' + normalizedR;
						}
						if (!/^0x[0-9a-fA-F]{64}$/.test(normalizedR)) {
							throw new NodeOperationError(this.getNode(), 'Invalid R component');
						}

						let normalizedS = s.trim();
						if (!normalizedS.startsWith('0x')) {
							normalizedS = '0x' + normalizedS;
						}
						if (!/^0x[0-9a-fA-F]{64}$/.test(normalizedS)) {
							throw new NodeOperationError(this.getNode(), 'Invalid S component');
						}

						parameters = [fromAddress, toAddress, value, validAfter, validBefore, normalizedNonce, v, normalizedR, normalizedS];
					}

					// Create contract instance
					const contract = new ethers.Contract(contractAddress, [functionAbi], wallet || provider);
					functionCall = contract.getFunction(functionAbi.name);
				}

				// Execute the call
				let result: any;
				let transactionHash: string | undefined;

				if (operation === 'read') {
					// Read call - force staticCall to prevent accidental transaction path
					const contractForRead = new ethers.Contract(contractAddress, [functionAbi], provider);
					const readMethod = contractForRead.getFunction(functionAbi.name);
					result = await readMethod.staticCall(...parameters);
				} else {
					// Transaction
					const tx = await functionCall(...parameters);
					result = await tx.wait();
					transactionHash = tx.hash;
				}

				// Prepare return data
				const returnObject: any = {
					operation,
					function: functionName,
					contractAddress,
					chainId,
					rpcUrl,
					result,
				};

				if (operation === 'transaction') {
					returnObject.transactionHash = transactionHash;
					returnObject.gasUsed = result.gasUsed?.toString();
					returnObject.blockNumber = result.blockNumber;
					returnObject.status = result.status;
				}

				if (functionName === 'custom') {
					returnObject.functionAbi = functionAbi;
					returnObject.parameters = parameters;
				} else {
					returnObject.functionSignature = PREDEFINED_FUNCTIONS[functionName as keyof typeof PREDEFINED_FUNCTIONS].signature;
					returnObject.parameters = parameters;
				}

				returnData.push({
					json: returnObject,
				});

			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: error instanceof Error ? error.message : String(error) },
					});
				} else {
					throw new NodeOperationError(this.getNode(), error instanceof Error ? error : new Error(String(error)));
				}
			}
		}

		return [returnData];
	}
}
