import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class EVMPrivateKey implements ICredentialType {
	name = 'evmPrivateKey';
	displayName = 'EVM Private Key';
	documentationUrl = 'https://ethereum.org/en/developers/docs/accounts/';
	properties: INodeProperties[] = [
		{
			displayName: 'Private Key',
			name: 'privateKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'The EVM private key for signing EIP-712 messages. Must be a 64-character hex string (with or without 0x prefix)',
		},
		{
			displayName: 'Network',
			name: 'network',
			type: 'options',
			options: [
				{
					name: 'Ethereum Mainnet',
					value: 'mainnet',
				},
				{
					name: 'Ethereum Sepolia',
					value: 'sepolia',
				},
				{
					name: 'Ethereum Goerli',
					value: 'goerli',
				},
				{
					name: 'Polygon',
					value: 'polygon',
				},
				{
					name: 'Arbitrum',
					value: 'arbitrum',
				},
				{
					name: 'Optimism',
					value: 'optimism',
				},
				{
					name: 'Custom',
					value: 'custom',
				},
			],
			default: 'mainnet',
			description: 'The EVM network this private key is associated with',
		},
		{
			displayName: 'Custom Chain ID',
			name: 'chainId',
			type: 'number',
			displayOptions: {
				show: {
					network: ['custom'],
				},
			},
			default: 1,
			description: 'Custom chain ID for the network',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			// No authentication headers needed for private key credentials
			// The private key is used directly for signing
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.etherscan.io',
			url: '/api',
			qs: {
				module: 'proxy',
				action: 'eth_blockNumber',
				apikey: 'YourApiKeyToken',
			},
		},
	};
}
