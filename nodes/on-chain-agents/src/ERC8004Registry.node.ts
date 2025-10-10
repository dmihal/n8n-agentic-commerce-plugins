import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';
import { BaseContract, Contract, ethers } from 'ethers';
import { CHAIN_CONFIGS } from './chainConfig';
import IdentityRegistryABI from './abis/IdentityRegistry.json';
import ReputationRegistryABI from './abis/ReputationRegistry.json';
import ValidationRegistryABI from './abis/ValidationRegistry.json';

// Hardcoded contract addresses
const CONTRACT_ADDRESSES = {
	identity: '0x7177a6867296406881E20d6647232314736Dd09A',
	reputation: '0xB5048e3ef1DA4E04deB6f7d0423D06F63869e322',
	validation: '0x662b40A526cb4017d947e71eAF6753BF3eeE66d8',
};

// Fully qualified names
const REGISTER = 'register()';
const REGISTER_WITH_URI = 'register(string)';
const REGISTER_WITH_METADATA = 'register(string,(string,bytes)[])';

export class ERC8004Registry implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'ERC-8004 Registry',
		name: 'erc8004Registry',
		icon: 'file:erc8004-registry.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["registry"] + ": " + $parameter["operation"]}}',
		description: 'Interact with ERC-8004 registries (Identity, Reputation, Validation)',
		defaults: {
			name: 'ERC-8004 Registry',
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
				displayName: 'Registry',
				name: 'registry',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Identity Registry',
						value: 'identity',
						description: 'Agent identity and metadata management',
					},
					{
						name: 'Reputation Registry',
						value: 'reputation',
						description: 'Agent feedback and reputation management',
					},
					{
						name: 'Validation Registry',
						value: 'validation',
						description: 'Agent validation and verification management',
					},
				],
				default: 'identity',
				description: 'Select the ERC-8004 registry to interact with',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					// Identity Registry operations
					{
						name: 'Register Agent',
						value: REGISTER,
						description: 'Register a new agent',
						action: 'Register a new agent',
					},
					{
						name: 'Register Agent with URI',
						value: REGISTER_WITH_URI,
						description: 'Register a new agent with token URI',
						action: 'Register a new agent with URI',
					},
					{
						name: 'Register Agent with Metadata',
						value: REGISTER_WITH_METADATA,
						description: 'Register a new agent with token URI and metadata',
						action: 'Register a new agent with metadata',
					},
					{
						name: 'Set Metadata',
						value: 'setMetadata',
						description: 'Set metadata for an agent',
						action: 'Set metadata',
					},
					{
						name: 'Check Agent Exists',
						value: 'agentExists',
						description: 'Check if an agent exists',
						action: 'Check if agent exists',
					},
					{
						name: 'Get Agent Owner',
						value: 'ownerOf',
						description: 'Get the owner of an agent',
						action: 'Get agent owner',
					},
					{
						name: 'Get Token URI',
						value: 'tokenURI',
						description: 'Get the token URI of an agent',
						action: 'Get token URI',
					},
					{
						name: 'Get Metadata',
						value: 'getMetadata',
						description: 'Get metadata for an agent',
						action: 'Get metadata',
					},
					{
						name: 'Get Balance',
						value: 'balanceOf',
						description: 'Get the balance of an address',
						action: 'Get balance',
					},
					{
						name: 'Get Total Agents',
						value: 'totalAgents',
						description: 'Get the total number of agents',
						action: 'Get total agents',
					},
				],
				displayOptions: {
					show: {
						registry: ['identity'],
					},
				},
				default: REGISTER,
				description: 'Select the operation to perform',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					// Reputation Registry operations
					{
						name: 'Give Feedback',
						value: 'giveFeedback',
						description: 'Give feedback to an agent',
						action: 'Give feedback',
					},
					{
						name: 'Revoke Feedback',
						value: 'revokeFeedback',
						description: 'Revoke previously given feedback',
						action: 'Revoke feedback',
					},
					{
						name: 'Append Response',
						value: 'appendResponse',
						description: 'Append a response to feedback',
						action: 'Append response',
					},
					{
						name: 'Read Feedback',
						value: 'readFeedback',
						description: 'Read specific feedback',
						action: 'Read feedback',
					},
					{
						name: 'Read All Feedback',
						value: 'readAllFeedback',
						description: 'Read all feedback for an agent',
						action: 'Read all feedback',
					},
					{
						name: 'Get Summary',
						value: 'getSummary',
						description: 'Get reputation summary for an agent',
						action: 'Get summary',
					},
					{
						name: 'Get Clients',
						value: 'getClients',
						description: 'Get all clients who gave feedback',
						action: 'Get clients',
					},
					{
						name: 'Get Last Index',
						value: 'getLastIndex',
						description: 'Get the last feedback index',
						action: 'Get last index',
					},
					{
						name: 'Get Response Count',
						value: 'getResponseCount',
						description: 'Get the response count for feedback',
						action: 'Get response count',
					},
					{
						name: 'Get Identity Registry',
						value: 'getIdentityRegistry',
						description: 'Get the identity registry address',
						action: 'Get identity registry',
					},
				],
				displayOptions: {
					show: {
						registry: ['reputation'],
					},
				},
				default: 'giveFeedback',
				description: 'Select the operation to perform',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					// Validation Registry operations
					{
						name: 'Validation Request',
						value: 'validationRequest',
						description: 'Request validation for an agent',
						action: 'Request validation',
					},
					{
						name: 'Validation Response',
						value: 'validationResponse',
						description: 'Respond to a validation request',
						action: 'Respond to validation',
					},
					{
						name: 'Get Validation Status',
						value: 'getValidationStatus',
						description: 'Get validation status',
						action: 'Get validation status',
					},
					{
						name: 'Get Request',
						value: 'getRequest',
						description: 'Get validation request details',
						action: 'Get request',
					},
					{
						name: 'Get Summary',
						value: 'getSummary',
						description: 'Get validation summary for an agent',
						action: 'Get summary',
					},
					{
						name: 'Get Agent Validations',
						value: 'getAgentValidations',
						description: 'Get all validations for an agent',
						action: 'Get agent validations',
					},
					{
						name: 'Get Validator Requests',
						value: 'getValidatorRequests',
						description: 'Get all requests for a validator',
						action: 'Get validator requests',
					},
					{
						name: 'Request Exists',
						value: 'requestExists',
						description: 'Check if a validation request exists',
						action: 'Check request exists',
					},
					{
						name: 'Get Identity Registry',
						value: 'getIdentityRegistry',
						description: 'Get the identity registry address',
						action: 'Get identity registry',
					},
				],
				displayOptions: {
					show: {
						registry: ['validation'],
					},
				},
				default: 'validationRequest',
				description: 'Select the operation to perform',
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
			// Identity Registry parameters
			{
				displayName: 'Agent ID',
				name: 'agentId',
				type: 'string',
				displayOptions: {
					show: {
						registry: ['identity'],
						operation: ['agentExists', 'ownerOf', 'tokenURI', 'getMetadata', 'setMetadata'],
					},
				},
				default: '',
				required: true,
				description: 'The agent ID',
			},
			{
				displayName: 'Token URI',
				name: 'tokenURI',
				type: 'string',
				displayOptions: {
					show: {
						registry: ['identity'],
            operation: [REGISTER_WITH_URI, REGISTER_WITH_METADATA],
					},
				},
				default: '',
				required: true,
				description: 'The token URI for the agent registration',
			},
			{
				displayName: 'Metadata Key',
				name: 'metadataKey',
				type: 'string',
				displayOptions: {
					show: {
						registry: ['identity'],
						operation: ['getMetadata', 'setMetadata'],
					},
				},
				default: '',
				required: true,
				description: 'The metadata key',
			},
			{
				displayName: 'Metadata Value',
				name: 'metadataValue',
				type: 'string',
				displayOptions: {
					show: {
						registry: ['identity'],
						operation: ['setMetadata'],
					},
				},
				default: '',
				required: true,
				description: 'The metadata value (hex encoded)',
			},
			{
				displayName: 'Metadata Entries',
				name: 'metadataEntries',
				type: 'json',
				displayOptions: {
					show: {
						registry: ['identity'],
						operation: [REGISTER_WITH_METADATA],
					},
				},
				default: '[{"key": "agentName", "value": "0x..."}]',
				description: 'Array of metadata entries with key and value',
			},
			{
				displayName: 'Address',
				name: 'address',
				type: 'string',
				displayOptions: {
					show: {
						registry: ['identity'],
						operation: ['balanceOf'],
					},
				},
				default: '',
				required: true,
				description: 'The address to check balance for',
			},
			// Reputation Registry parameters
			{
				displayName: 'Agent ID',
				name: 'agentId',
				type: 'string',
				displayOptions: {
					show: {
						registry: ['reputation'],
						operation: ['giveFeedback', 'revokeFeedback', 'appendResponse', 'readFeedback', 'readAllFeedback', 'getSummary', 'getClients', 'getLastIndex', 'getResponseCount'],
					},
				},
				default: '',
				required: true,
				description: 'The agent ID',
			},
			{
				displayName: 'Score',
				name: 'score',
				type: 'number',
				displayOptions: {
					show: {
						registry: ['reputation'],
						operation: ['giveFeedback'],
					},
				},
				default: 100,
				required: true,
				description: 'Feedback score (0-100)',
			},
			{
				displayName: 'Tag 1',
				name: 'tag1',
				type: 'string',
				displayOptions: {
					show: {
						registry: ['reputation'],
						operation: ['giveFeedback'],
					},
				},
				default: '',
				description: 'First tag for categorization',
			},
			{
				displayName: 'Tag 2',
				name: 'tag2',
				type: 'string',
				displayOptions: {
					show: {
						registry: ['reputation'],
						operation: ['giveFeedback'],
					},
				},
				default: '',
				description: 'Second tag for categorization',
			},
			{
				displayName: 'File URI',
				name: 'fileURI',
				type: 'string',
				displayOptions: {
					show: {
						registry: ['reputation'],
						operation: ['giveFeedback'],
					},
				},
				default: '',
				description: 'URI to feedback file',
			},
			{
				displayName: 'File Hash',
				name: 'fileHash',
				type: 'string',
				displayOptions: {
					show: {
						registry: ['reputation'],
						operation: ['giveFeedback'],
					},
				},
				default: '',
				description: 'Hash of the feedback file',
			},
			{
				displayName: 'Feedback Auth',
				name: 'feedbackAuth',
				type: 'string',
				displayOptions: {
					show: {
						registry: ['reputation'],
						operation: ['giveFeedback'],
					},
				},
				default: '',
				required: true,
				description: 'Authorization signature for feedback',
			},
			{
				displayName: 'Feedback Index',
				name: 'feedbackIndex',
				type: 'string',
				displayOptions: {
					show: {
						registry: ['reputation'],
						operation: ['revokeFeedback', 'appendResponse', 'readFeedback', 'getResponseCount'],
					},
				},
				default: '',
				required: true,
				description: 'The feedback index',
			},
			{
				displayName: 'Client Address',
				name: 'clientAddress',
				type: 'string',
				displayOptions: {
					show: {
						registry: ['reputation'],
						operation: ['readFeedback', 'getLastIndex', 'getResponseCount'],
					},
				},
				default: '',
				required: true,
				description: 'The client address',
			},
			{
				displayName: 'Response URI',
				name: 'responseURI',
				type: 'string',
				displayOptions: {
					show: {
						registry: ['reputation'],
						operation: ['appendResponse'],
					},
				},
				default: '',
				description: 'URI to response file',
			},
			{
				displayName: 'Response Hash',
				name: 'responseHash',
				type: 'string',
				displayOptions: {
					show: {
						registry: ['reputation'],
						operation: ['appendResponse'],
					},
				},
				default: '',
				description: 'Hash of the response file',
			},
			{
				displayName: 'Client Addresses',
				name: 'clientAddresses',
				type: 'json',
				displayOptions: {
					show: {
						registry: ['reputation'],
						operation: ['readAllFeedback', 'getSummary'],
					},
				},
				default: '[]',
				description: 'Array of client addresses to filter by',
			},
			{
				displayName: 'Tag 1 Filter',
				name: 'tag1Filter',
				type: 'string',
				displayOptions: {
					show: {
						registry: ['reputation'],
						operation: ['readAllFeedback', 'getSummary'],
					},
				},
				default: '',
				description: 'Tag 1 filter',
			},
			{
				displayName: 'Tag 2 Filter',
				name: 'tag2Filter',
				type: 'string',
				displayOptions: {
					show: {
						registry: ['reputation'],
						operation: ['readAllFeedback', 'getSummary'],
					},
				},
				default: '',
				description: 'Tag 2 filter',
			},
			{
				displayName: 'Include Revoked',
				name: 'includeRevoked',
				type: 'boolean',
				displayOptions: {
					show: {
						registry: ['reputation'],
						operation: ['readAllFeedback'],
					},
				},
				default: false,
				description: 'Include revoked feedback',
			},
			{
				displayName: 'Responders',
				name: 'responders',
				type: 'json',
				displayOptions: {
					show: {
						registry: ['reputation'],
						operation: ['getResponseCount'],
					},
				},
				default: '[]',
				description: 'Array of responder addresses',
			},
			// Validation Registry parameters
			{
				displayName: 'Agent ID',
				name: 'agentId',
				type: 'string',
				displayOptions: {
					show: {
						registry: ['validation'],
						operation: ['validationRequest', 'getSummary', 'getAgentValidations'],
					},
				},
				default: '',
				required: true,
				description: 'The agent ID',
			},
			{
				displayName: 'Validator Address',
				name: 'validatorAddress',
				type: 'string',
				displayOptions: {
					show: {
						registry: ['validation'],
						operation: ['validationRequest'],
					},
				},
				default: '',
				required: true,
				description: 'The validator address',
			},
			{
				displayName: 'Request URI',
				name: 'requestURI',
				type: 'string',
				displayOptions: {
					show: {
						registry: ['validation'],
						operation: ['validationRequest'],
					},
				},
				default: '',
				required: true,
				description: 'URI to validation request data',
			},
			{
				displayName: 'Request Hash',
				name: 'requestHash',
				type: 'string',
				displayOptions: {
					show: {
						registry: ['validation'],
						operation: ['validationRequest', 'validationResponse', 'getValidationStatus', 'getRequest', 'requestExists'],
					},
				},
				default: '',
				required: true,
				description: 'Hash of the validation request',
			},
			{
				displayName: 'Response',
				name: 'response',
				type: 'number',
				displayOptions: {
					show: {
						registry: ['validation'],
						operation: ['validationResponse'],
					},
				},
				default: 100,
				required: true,
				description: 'Validation response (0-100)',
			},
			{
				displayName: 'Response URI',
				name: 'responseURI',
				type: 'string',
				displayOptions: {
					show: {
						registry: ['validation'],
						operation: ['validationResponse'],
					},
				},
				default: '',
				description: 'URI to validation response data',
			},
			{
				displayName: 'Response Hash',
				name: 'responseHash',
				type: 'string',
				displayOptions: {
					show: {
						registry: ['validation'],
						operation: ['validationResponse'],
					},
				},
				default: '',
				description: 'Hash of the validation response',
			},
			{
				displayName: 'Tag',
				name: 'tag',
				type: 'string',
				displayOptions: {
					show: {
						registry: ['validation'],
						operation: ['validationResponse', 'getSummary'],
					},
				},
				default: '',
				description: 'Tag for categorization',
			},
			{
				displayName: 'Validator Addresses',
				name: 'validatorAddresses',
				type: 'json',
				displayOptions: {
					show: {
						registry: ['validation'],
						operation: ['getSummary'],
					},
				},
				default: '[]',
				description: 'Array of validator addresses to filter by',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const registry = this.getNodeParameter('registry', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;
				const blockchain = this.getNodeParameter('blockchain', i) as string;
				const contractAddress = CONTRACT_ADDRESSES[registry as keyof typeof CONTRACT_ADDRESSES];

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

				// Get ABI based on registry
				let abi: any[];
				switch (registry) {
					case 'identity':
						abi = IdentityRegistryABI as any[];
						break;
					case 'reputation':
						abi = ReputationRegistryABI as any[];
						break;
					case 'validation':
						abi = ValidationRegistryABI as any[];
						break;
					default:
						throw new NodeOperationError(this.getNode(), 'Invalid registry selection');
				}

				// Create contract instance
				let contract = new ethers.Contract(contractAddress, abi, provider);

				// const isWriteOperation = functionAbi && functionAbi.stateMutability !== 'view' && functionAbi.stateMutability !== 'pure';
        const isWriteOperation = contract.getFunction(operation).fragment.stateMutability !== 'view' && contract.getFunction(operation).fragment.stateMutability !== 'pure';

				// Get credentials for write operations
				let wallet: ethers.Wallet | undefined;
				if (isWriteOperation) {
					const credentials = await this.getCredentials('evmPrivateKey');
					
					if (!credentials?.privateKey) {
						throw new NodeOperationError(this.getNode(), 'Private key is required for write operations');
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

          contract = contract.connect(wallet) as Contract;
				}

        // Prepare parameters based on operation
        const parameters: any[] = [];
        
        if (registry === 'identity') {
          switch (operation) {
            case REGISTER:
              // No parameters
              break;
            case REGISTER_WITH_URI:
              parameters.push(this.getNodeParameter('tokenURI', i));
              break;
            case REGISTER_WITH_METADATA:
              parameters.push(this.getNodeParameter('tokenURI', i));
              const metadataEntries = JSON.parse(this.getNodeParameter('metadataEntries', i) as string);
              parameters.push(metadataEntries);
              break;
            case 'setMetadata':
              parameters.push(this.getNodeParameter('agentId', i));
              parameters.push(this.getNodeParameter('metadataKey', i));
              parameters.push(this.getNodeParameter('metadataValue', i));
              break;
            case 'agentExists':
            case 'ownerOf':
            case 'tokenURI':
              parameters.push(this.getNodeParameter('agentId', i));
              break;
            case 'getMetadata':
              parameters.push(this.getNodeParameter('agentId', i));
              parameters.push(this.getNodeParameter('metadataKey', i));
              break;
            case 'balanceOf':
              parameters.push(this.getNodeParameter('address', i));
              break;
            case 'totalAgents':
              // No parameters
              break;
          }
        } else if (registry === 'reputation') {
          switch (operation) {
            case 'giveFeedback':
              parameters.push(this.getNodeParameter('agentId', i));
              parameters.push(this.getNodeParameter('score', i));
              parameters.push(this.getNodeParameter('tag1', i));
              parameters.push(this.getNodeParameter('tag2', i));
              parameters.push(this.getNodeParameter('fileURI', i));
              parameters.push(this.getNodeParameter('fileHash', i));
              parameters.push(this.getNodeParameter('feedbackAuth', i));
              break;
            case 'revokeFeedback':
              parameters.push(this.getNodeParameter('agentId', i));
              parameters.push(this.getNodeParameter('feedbackIndex', i));
              break;
            case 'appendResponse':
              parameters.push(this.getNodeParameter('agentId', i));
              parameters.push(this.getNodeParameter('clientAddress', i));
              parameters.push(this.getNodeParameter('feedbackIndex', i));
              parameters.push(this.getNodeParameter('responseURI', i));
              parameters.push(this.getNodeParameter('responseHash', i));
              break;
            case 'readFeedback':
              parameters.push(this.getNodeParameter('agentId', i));
              parameters.push(this.getNodeParameter('clientAddress', i));
              parameters.push(this.getNodeParameter('feedbackIndex', i));
              break;
            case 'readAllFeedback':
              parameters.push(this.getNodeParameter('agentId', i));
              const clientAddresses = JSON.parse(this.getNodeParameter('clientAddresses', i) as string);
              parameters.push(clientAddresses);
              parameters.push(this.getNodeParameter('tag1Filter', i));
              parameters.push(this.getNodeParameter('tag2Filter', i));
              parameters.push(this.getNodeParameter('includeRevoked', i));
              break;
            case 'getSummary':
              parameters.push(this.getNodeParameter('agentId', i));
              const clientAddresses2 = JSON.parse(this.getNodeParameter('clientAddresses', i) as string);
              parameters.push(clientAddresses2);
              parameters.push(this.getNodeParameter('tag1Filter', i));
              parameters.push(this.getNodeParameter('tag2Filter', i));
              break;
            case 'getClients':
              parameters.push(this.getNodeParameter('agentId', i));
              break;
            case 'getLastIndex':
              parameters.push(this.getNodeParameter('agentId', i));
              parameters.push(this.getNodeParameter('clientAddress', i));
              break;
            case 'getResponseCount':
              parameters.push(this.getNodeParameter('agentId', i));
              parameters.push(this.getNodeParameter('clientAddress', i));
              parameters.push(this.getNodeParameter('feedbackIndex', i));
              const responders = JSON.parse(this.getNodeParameter('responders', i) as string);
              parameters.push(responders);
              break;
            case 'getIdentityRegistry':
              // No parameters
              break;
          }
        } else if (registry === 'validation') {
          switch (operation) {
            case 'validationRequest':
              parameters.push(this.getNodeParameter('validatorAddress', i));
              parameters.push(this.getNodeParameter('agentId', i));
              parameters.push(this.getNodeParameter('requestURI', i));
              parameters.push(this.getNodeParameter('requestHash', i));
              break;
            case 'validationResponse':
              parameters.push(this.getNodeParameter('requestHash', i));
              parameters.push(this.getNodeParameter('response', i));
              parameters.push(this.getNodeParameter('responseURI', i));
              parameters.push(this.getNodeParameter('responseHash', i));
              parameters.push(this.getNodeParameter('tag', i));
              break;
            case 'getValidationStatus':
            case 'getRequest':
            case 'requestExists':
              parameters.push(this.getNodeParameter('requestHash', i));
              break;
            case 'getSummary':
              parameters.push(this.getNodeParameter('agentId', i));
              const validatorAddresses = JSON.parse(this.getNodeParameter('validatorAddresses', i) as string);
              parameters.push(validatorAddresses);
              parameters.push(this.getNodeParameter('tag', i));
              break;
            case 'getAgentValidations':
              parameters.push(this.getNodeParameter('agentId', i));
              break;
            case 'getValidatorRequests':
              parameters.push(this.getNodeParameter('validatorAddress', i));
              break;
            case 'getIdentityRegistry':
              // No parameters
              break;
          }
        }

				// Execute the call
				let result: any;
				let transactionHash: string | undefined;

				if (isWriteOperation) {
					// Write operation
					let contractMethod;
					
					// Handle register function overloads using fully qualified names
          contractMethod = contract[operation];
					
					const tx = await contractMethod(...parameters);
					result = await tx.wait();
					transactionHash = tx.hash;
				} else {
					// Read operation
					result = await contract[operation](...parameters);
				}

				// Prepare return data
				const returnObject: any = {
					registry,
					operation,
					contractAddress,
					chainId,
					rpcUrl,
					result,
				};

				if (isWriteOperation) {
					returnObject.transactionHash = transactionHash;
					returnObject.gasUsed = result.gasUsed?.toString();
					returnObject.blockNumber = result.blockNumber;
					returnObject.status = result.status;
				}

				returnObject.parameters = parameters;

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
