export interface ChainConfig {
	id: string;
	name: string;
	chainId: number;
	rpcUrl: string;
}

export const CHAIN_CONFIGS: ChainConfig[] = [
	{
		id: 'ethereum',
		name: 'Ethereum Mainnet',
		chainId: 1,
		rpcUrl: 'https://eth.llamarpc.com',
	},
	{
		id: 'polygon',
		name: 'Polygon',
		chainId: 137,
		rpcUrl: 'https://polygon.llamarpc.com',
	},
	{
		id: 'base',
		name: 'Base',
		chainId: 8453,
		rpcUrl: 'https://mainnet.base.org',
	},
	{
		id: 'sepolia',
		name: 'Sepolia Testnet',
		chainId: 11155111,
		rpcUrl: 'https://0xrpc.io/sep',
	},
	{
		id: 'base-sepolia',
		name: 'Base Sepolia Testnet',
		chainId: 84532,
		rpcUrl: 'https://sepolia.base.org',
	},
];
