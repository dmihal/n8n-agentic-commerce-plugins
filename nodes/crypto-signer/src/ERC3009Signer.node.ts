import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';
import { ethers } from 'ethers';
import { CHAIN_CONFIGS } from './chainConfig';

interface ERC3009Domain {
	name: string;
	version: string;
	chainId: number;
	verifyingContract: string;
}

interface TransferWithAuthorization {
	from: string;
	to: string;
	value: string;
	validAfter: number;
	validBefore: number;
	nonce: string;
}

export class ERC3009Signer implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'ERC-3009 Signer',
		name: 'erc3009Signer',
		icon: 'file:erc3009-signer.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Sign and verify ERC-3009 transferWithAuthorization signatures',
		defaults: {
			name: 'ERC-3009 Signer',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'evmPrivateKey',
				required: true,
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
						name: 'Sign Transfer Authorization',
						value: 'sign',
						action: 'Sign ERC-3009 transfer authorization',
						description: 'Sign a transferWithAuthorization message',
					},
					{
						name: 'Verify Transfer Authorization',
						value: 'verify',
						action: 'Verify ERC-3009 transfer authorization',
						description: 'Verify a transferWithAuthorization signature',
					},
				],
				default: 'sign',
			},
			{
				displayName: 'Token Contract Address',
				name: 'tokenContract',
				type: 'string',
				default: '',
				required: true,
				description: 'The address of the ERC-3009 token contract',
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
				displayName: 'From Address',
				name: 'fromAddress',
				type: 'string',
				default: '',
				required: true,
				description: 'The address of the token sender',
			},
			{
				displayName: 'To Address',
				name: 'toAddress',
				type: 'string',
				default: '',
				required: true,
				description: 'The address of the token recipient',
			},
			{
				displayName: 'Value',
				name: 'value',
				type: 'string',
				default: '0',
				required: true,
				description: 'The amount of tokens to transfer (in wei)',
			},
			{
				displayName: 'Valid After (Unix Timestamp)',
				name: 'validAfter',
				type: 'number',
				default: 0,
				description: 'The time after which the authorization is valid (unix timestamp)',
			},
			{
				displayName: 'Valid Before (Unix Timestamp)',
				name: 'validBefore',
				type: 'number',
				default: 0,
				description: 'The time before which the authorization is valid (unix timestamp)',
			},
			{
				displayName: 'Nonce',
				name: 'nonce',
				type: 'string',
				default: '',
				required: true,
				description: 'A unique nonce for the authorization (32 bytes hex string)',
			},
			{
				displayName: 'Signature to Verify',
				name: 'signatureToVerify',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['verify'],
					},
				},
				default: '',
				description: 'The signature to verify (for verify operation)',
			},
			{
				displayName: 'Expected Signer Address',
				name: 'expectedSignerAddress',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['verify'],
					},
				},
				default: '',
				description: 'The expected signer address (for verify operation)',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;
				const credentials = await this.getCredentials('evmPrivateKey');
				
				if (!credentials?.privateKey) {
					throw new NodeOperationError(this.getNode(), 'Private key is required');
				}

				// Validate and normalize private key
				let privateKey = credentials.privateKey as string;
				
				// Remove any whitespace
				privateKey = privateKey.trim();
				
				// Add 0x prefix if missing
				if (!privateKey.startsWith('0x')) {
					privateKey = '0x' + privateKey;
				}
				
				// Validate private key format
				if (!/^0x[0-9a-fA-F]{64}$/.test(privateKey)) {
					throw new NodeOperationError(this.getNode(), 'Invalid private key format. Must be a 64-character hex string (with or without 0x prefix)');
				}

				// Create wallet from private key with proper error handling
				let wallet: ethers.Wallet;
				try {
					wallet = new ethers.Wallet(privateKey);
				} catch (error) {
					throw new NodeOperationError(this.getNode(), `Invalid private key: ${error instanceof Error ? error.message : String(error)}`);
				}

				// Get ERC-3009 specific parameters
				const tokenContract = this.getNodeParameter('tokenContract', i) as string;
				const blockchain = this.getNodeParameter('blockchain', i) as string;
				const fromAddress = this.getNodeParameter('fromAddress', i) as string;
				const toAddress = this.getNodeParameter('toAddress', i) as string;
				const value = this.getNodeParameter('value', i) as string;
				const validAfter = this.getNodeParameter('validAfter', i) as number;
				const validBefore = this.getNodeParameter('validBefore', i) as number;
				const nonce = this.getNodeParameter('nonce', i) as string;

				// Validate addresses
				if (!ethers.isAddress(tokenContract)) {
					throw new NodeOperationError(this.getNode(), 'Invalid token contract address');
				}
				if (!ethers.isAddress(fromAddress)) {
					throw new NodeOperationError(this.getNode(), 'Invalid from address');
				}
				if (!ethers.isAddress(toAddress)) {
					throw new NodeOperationError(this.getNode(), 'Invalid to address');
				}

				// Validate nonce format (should be 32 bytes = 64 hex characters)
				let normalizedNonce = nonce.trim();
				if (!normalizedNonce.startsWith('0x')) {
					normalizedNonce = '0x' + normalizedNonce;
				}
				if (!/^0x[0-9a-fA-F]{64}$/.test(normalizedNonce)) {
					throw new NodeOperationError(this.getNode(), 'Invalid nonce format. Must be a 64-character hex string (32 bytes)');
				}

				// Validate value is a valid number
				if (!/^\d+$/.test(value)) {
					throw new NodeOperationError(this.getNode(), 'Invalid value. Must be a positive integer (in wei)');
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

				// Create provider to fetch token name
				const provider = new ethers.JsonRpcProvider(rpcUrl);
				
				// Fetch token name dynamically
				let tokenName: string;
				try {
					const abi = ['function name() view returns (string)'];
					const contract = new ethers.Contract(tokenContract, abi, provider);
					tokenName = await contract.name();
				} catch (error) {
					throw new NodeOperationError(this.getNode(), `Failed to fetch token name: ${error instanceof Error ? error.message : String(error)}. Make sure the contract supports the ERC-20 name() function.`);
				}

				// Define ERC-3009 domain according to EIP-3009
				const domain: ERC3009Domain = {
					name: tokenName,
					version: '2', // ERC-3009 version
					chainId: chainId,
					verifyingContract: tokenContract,
				};

				// Define ERC-3009 types according to EIP-3009
				const types = {
					TransferWithAuthorization: [
						{ name: 'from', type: 'address' },
						{ name: 'to', type: 'address' },
						{ name: 'value', type: 'uint256' },
						{ name: 'validAfter', type: 'uint256' },
						{ name: 'validBefore', type: 'uint256' },
						{ name: 'nonce', type: 'bytes32' },
					],
				};

				// Create the transfer authorization message
				const message: TransferWithAuthorization = {
					from: fromAddress,
					to: toAddress,
					value: value,
					validAfter: validAfter,
					validBefore: validBefore,
					nonce: normalizedNonce,
				};

				if (operation === 'sign') {
					// Sign the transfer authorization
					const signature = await wallet.signTypedData(domain, types, message);
					const signerAddress = wallet.address;

					returnData.push({
						json: {
							signature,
							signerAddress,
							domain,
							types,
							message,
							operation: 'transferWithAuthorization',
							tokenContract,
							fromAddress,
							toAddress,
							value,
							validAfter,
							validBefore,
							nonce: normalizedNonce,
						},
					});

				} else if (operation === 'verify') {
					// Get verification parameters
					const signatureToVerify = this.getNodeParameter('signatureToVerify', i) as string;
					const expectedSignerAddress = this.getNodeParameter('expectedSignerAddress', i) as string;

					// Verify the signature
					let recoveredAddress: string;
					try {
						recoveredAddress = ethers.verifyTypedData(domain, types, message, signatureToVerify);
					} catch (error) {
						throw new NodeOperationError(this.getNode(), `Signature verification failed: ${error instanceof Error ? error.message : String(error)}`);
					}

					const { v, r, s } = ethers.Signature.from(signatureToVerify);

					const isValid = recoveredAddress.toLowerCase() === expectedSignerAddress.toLowerCase();

					returnData.push({
						json: {
							isValid,
							recoveredAddress,
							expectedSignerAddress,
							signature: signatureToVerify,
							v,
							r,
							s,
							domain,
							types,
							message,
							operation: 'transferWithAuthorization',
							tokenContract,
							fromAddress,
							toAddress,
							value,
							validAfter,
							validBefore,
							nonce: normalizedNonce,
						},
					});
				}

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
