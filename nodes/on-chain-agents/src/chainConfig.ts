export interface ChainConfig {
	name: string;
	chainId: number;
	rpcUrl: string;
}

export const CHAIN_CONFIGS: ChainConfig[] = [
	{
		name: 'Ethereum Mainnet',
		chainId: 1,
		rpcUrl: 'https://eth.llamarpc.com',
	},
	{
		name: 'Polygon',
		chainId: 137,
		rpcUrl: 'https://polygon.llamarpc.com',
	},
	{
		name: 'Base',
		chainId: 8453,
		rpcUrl: 'https://mainnet.base.org',
	},
	{
		name: 'Sepolia Testnet',
		chainId: 11155111,
		rpcUrl: 'https://0xrpc.io/sep',
	},
	{
		name: 'Base Sepolia Testnet',
		chainId: 84532,
		rpcUrl: 'https://sepolia.base.org',
	},
];
