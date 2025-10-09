import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';
import { ethers } from 'ethers';

interface EIP712Domain {
	name?: string;
	version?: string;
	chainId?: number;
	verifyingContract?: string;
	salt?: string;
}

interface EIP712Types {
	[key: string]: Array<{ name: string; type: string }>;
}

interface EIP712Message {
	[key: string]: any;
}

export class EIP712Signer implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'EIP-712 Signer',
		name: 'eip712Signer',
		icon: 'file:eip712-signer.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Sign EIP-712 typed structured data with EVM private key',
		defaults: {
			name: 'EIP-712 Signer',
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
						name: 'Sign Message',
						value: 'sign',
						action: 'Sign EIP-712 message',
						description: 'Sign a typed structured data message',
					},
					{
						name: 'Verify Signature',
						value: 'verify',
						action: 'Verify EIP-712 signature',
						description: 'Verify a signed EIP-712 message',
					},
				],
				default: 'sign',
			},
			{
				displayName: 'Domain Name',
				name: 'domainName',
				type: 'string',
				default: '',
				description: 'The name of the domain (e.g., "MyDApp")',
			},
			{
				displayName: 'Domain Version',
				name: 'domainVersion',
				type: 'string',
				default: '1',
				description: 'The version of the domain',
			},
			{
				displayName: 'Chain ID',
				name: 'chainId',
				type: 'number',
				default: 1,
				description: 'The chain ID for the domain',
			},
			{
				displayName: 'Verifying Contract',
				name: 'verifyingContract',
				type: 'string',
				default: '',
				description: 'The address of the verifying contract (optional)',
			},
			{
				displayName: 'Salt',
				name: 'salt',
				type: 'string',
				default: '',
				description: 'The salt for the domain (optional)',
			},
			{
				displayName: 'Types Definition',
				name: 'typesDefinition',
				type: 'json',
				default: '{\n  "Person": [\n    {"name": "name", "type": "string"},\n    {"name": "wallet", "type": "address"}\n  ]\n}',
				description: 'JSON definition of the types for EIP-712 signing',
			},
			{
				displayName: 'Primary Type',
				name: 'primaryType',
				type: 'string',
				default: 'Person',
				description: 'The primary type of the message to sign',
			},
			{
				displayName: 'Message Data',
				name: 'messageData',
				type: 'json',
				default: '{\n  "name": "Alice",\n  "wallet": "0x1234567890123456789012345678901234567890"\n}',
				description: 'The message data to sign',
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
				displayName: 'Signer Address',
				name: 'signerAddress',
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
        console.log('credentials', credentials);
				
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

				if (operation === 'sign') {
					// Get parameters for signing
					const domainName = this.getNodeParameter('domainName', i) as string;
					const domainVersion = this.getNodeParameter('domainVersion', i) as string;
					const chainId = this.getNodeParameter('chainId', i) as number;
					const verifyingContract = this.getNodeParameter('verifyingContract', i) as string;
					const salt = this.getNodeParameter('salt', i) as string;
					const typesDefinition = this.getNodeParameter('typesDefinition', i) as string;
					const primaryType = this.getNodeParameter('primaryType', i) as string;
					const messageData = this.getNodeParameter('messageData', i) as string;

					// Parse JSON inputs
					let types: EIP712Types;
					let message: EIP712Message;
					
					try {
						types = JSON.parse(typesDefinition);
					} catch (error) {
						throw new NodeOperationError(this.getNode(), 'Invalid types definition JSON');
					}

					try {
						message = JSON.parse(messageData);
					} catch (error) {
						throw new NodeOperationError(this.getNode(), 'Invalid message data JSON');
					}

					// Build domain
					const domain: EIP712Domain = {
						name: domainName || undefined,
						version: domainVersion || undefined,
						chainId: chainId || undefined,
						verifyingContract: verifyingContract || undefined,
						salt: salt || undefined,
					};

					// Remove undefined values
					Object.keys(domain).forEach(key => {
						if (domain[key as keyof EIP712Domain] === undefined) {
							delete domain[key as keyof EIP712Domain];
						}
					});

					// Sign the message
					const signature = await wallet.signTypedData(domain, types, message);

					// Get the signer address
					const signerAddress = wallet.address;

					returnData.push({
						json: {
							signature,
							signerAddress,
							domain,
							types,
							message,
							primaryType,
						},
					});

				} else if (operation === 'verify') {
					// Get parameters for verification
					const domainName = this.getNodeParameter('domainName', i) as string;
					const domainVersion = this.getNodeParameter('domainVersion', i) as string;
					const chainId = this.getNodeParameter('chainId', i) as number;
					const verifyingContract = this.getNodeParameter('verifyingContract', i) as string;
					const salt = this.getNodeParameter('salt', i) as string;
					const typesDefinition = this.getNodeParameter('typesDefinition', i) as string;
					const primaryType = this.getNodeParameter('primaryType', i) as string;
					const messageData = this.getNodeParameter('messageData', i) as string;
					const signatureToVerify = this.getNodeParameter('signatureToVerify', i) as string;
					const expectedSignerAddress = this.getNodeParameter('signerAddress', i) as string;

					// Parse JSON inputs
					let types: EIP712Types;
					let message: EIP712Message;
					
					try {
						types = JSON.parse(typesDefinition);
					} catch (error) {
						throw new NodeOperationError(this.getNode(), 'Invalid types definition JSON');
					}

					try {
						message = JSON.parse(messageData);
					} catch (error) {
						throw new NodeOperationError(this.getNode(), 'Invalid message data JSON');
					}

					// Build domain
					const domain: EIP712Domain = {
						name: domainName || undefined,
						version: domainVersion || undefined,
						chainId: chainId || undefined,
						verifyingContract: verifyingContract || undefined,
						salt: salt || undefined,
					};

					// Remove undefined values
					Object.keys(domain).forEach(key => {
						if (domain[key as keyof EIP712Domain] === undefined) {
							delete domain[key as keyof EIP712Domain];
						}
					});

					// Verify the signature
					let recoveredAddress: string;
					try {
						recoveredAddress = ethers.verifyTypedData(domain, types, message, signatureToVerify);
					} catch (error) {
						throw new NodeOperationError(this.getNode(), `Signature verification failed: ${error instanceof Error ? error.message : String(error)}`);
					}

					const isValid = recoveredAddress.toLowerCase() === expectedSignerAddress.toLowerCase();

					returnData.push({
						json: {
							isValid,
							recoveredAddress,
							expectedSignerAddress,
							signature: signatureToVerify,
							domain,
							types,
							message,
							primaryType,
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
