import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

export class A2AAgentCard implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'A2A Agent Card',
		name: 'a2aAgentCard',
		icon: 'file:a2a-agent-card.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["displayName"]}}',
		description: 'Generate A2A-compliant agent card JSON for agent discovery',
		defaults: {
			name: 'A2A Agent Card',
		},
		inputs: ['main'],
		outputs: ['main'],
		properties: [
			{
				displayName: 'Agent ID',
				name: 'agentId',
				type: 'string',
				default: '',
				required: true,
				description: 'Unique identifier (UUID or DID) for the agent',
				placeholder: 'did:web:example.com',
			},
			{
				displayName: 'Display Name',
				name: 'displayName',
				type: 'string',
				default: '',
				required: true,
				description: 'Human-readable name of the agent',
				placeholder: 'My n8n Agent',
			},
			{
				displayName: 'Version',
				name: 'version',
				type: 'string',
				default: '1.0',
				required: true,
				description: 'A2A version supported by this agent',
			},
			{
				displayName: 'Endpoint Base URL',
				name: 'endpointBaseUrl',
				type: 'string',
				default: '',
				required: true,
				description: 'Base public URL of the agent\'s API endpoints',
				placeholder: 'https://example.com/webhook/a2a',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				required: false,
				description: 'Optional text describing the agent\'s purpose',
				placeholder: 'n8n A2A-compatible automation agent',
			},
			{
				displayName: 'Capabilities',
				name: 'capabilities',
				type: 'fixedCollection',
				default: {},
				required: true,
				description: 'List of supported capabilities/skills',
				typeOptions: {
					multipleValues: true,
				},
				options: [
					{
						name: 'capability',
						displayName: 'Capability',
						values: [
							{
								displayName: 'Capability Name',
								name: 'name',
								type: 'string',
								default: '',
								description: 'Name of the capability (e.g., message/send, tasks/get)',
								placeholder: 'message/send',
							},
						],
					},
				],
			},
			{
				displayName: 'Security Schemes',
				name: 'securitySchemes',
				type: 'fixedCollection',
				default: {},
				required: false,
				description: 'Supported authentication methods',
				typeOptions: {
					multipleValues: true,
				},
				options: [
					{
						name: 'scheme',
						displayName: 'Security Scheme',
						values: [
							{
								displayName: 'Scheme Name',
								name: 'name',
								type: 'string',
								default: '',
								description: 'Name of the security scheme',
								placeholder: 'apiKey',
							},
							{
								displayName: 'Type',
								name: 'type',
								type: 'options',
								options: [
									{
										name: 'API Key',
										value: 'apiKey',
									},
									{
										name: 'OAuth2',
										value: 'oauth2',
									},
									{
										name: 'mTLS',
										value: 'mtls',
									},
								],
								default: 'apiKey',
							},
							{
								displayName: 'Location',
								name: 'in',
								type: 'options',
								options: [
									{
										name: 'Header',
										value: 'header',
									},
									{
										name: 'Query',
										value: 'query',
									},
									{
										name: 'Cookie',
										value: 'cookie',
									},
								],
								default: 'header',
								displayOptions: {
									show: {
										type: ['apiKey'],
									},
								},
							},
							{
								displayName: 'Parameter Name',
								name: 'name',
								type: 'string',
								default: '',
								description: 'Name of the parameter',
								placeholder: 'Authorization',
								displayOptions: {
									show: {
										type: ['apiKey'],
									},
								},
							},
						],
					},
				],
			},
			{
				displayName: 'Extensions',
				name: 'extensions',
				type: 'fixedCollection',
				default: {},
				required: false,
				description: 'Protocol extensions (e.g., ERC-8004, x402)',
				typeOptions: {
					multipleValues: true,
				},
				options: [
					{
						name: 'extension',
						displayName: 'Extension',
						values: [
							{
								displayName: 'Extension Name',
								name: 'name',
								type: 'string',
								default: '',
								description: 'Name of the extension',
								placeholder: 'erc8004',
							},
							{
								displayName: 'Extension Value',
								name: 'value',
								type: 'string',
								default: '',
								description: 'Value or URL for the extension',
								placeholder: 'https://onchain.example/erc8004/agent',
							},
						],
					},
				],
			},
			{
				displayName: 'Auth Required for Extended Card',
				name: 'authRequiredForExtendedCard',
				type: 'boolean',
				default: false,
				description: 'Whether to hide sensitive fields behind authenticated route',
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'fixedCollection',
				default: {},
				required: false,
				description: 'Freeform metadata for future expansion',
				typeOptions: {
					multipleValues: true,
				},
				options: [
					{
						name: 'field',
						displayName: 'Field',
						values: [
							{
								displayName: 'Field Name',
								name: 'name',
								type: 'string',
								default: '',
								description: 'Name of the additional field',
							},
							{
								displayName: 'Field Value',
								name: 'value',
								type: 'string',
								default: '',
								description: 'Value of the additional field',
							},
						],
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const agentId = this.getNodeParameter('agentId', i) as string;
				const displayName = this.getNodeParameter('displayName', i) as string;
				const version = this.getNodeParameter('version', i) as string;
				const endpointBaseUrl = this.getNodeParameter('endpointBaseUrl', i) as string;
				const description = this.getNodeParameter('description', i) as string;
				const capabilities = this.getNodeParameter('capabilities', i) as any;
				const securitySchemes = this.getNodeParameter('securitySchemes', i) as any;
				const extensions = this.getNodeParameter('extensions', i) as any;
				const additionalFields = this.getNodeParameter('additionalFields', i) as any;

				// Build the agent card JSON
				const agentCard: any = {
					id: agentId,
					displayName: displayName,
					version: version,
					serviceEndpoint: {},
					capabilities: [],
				};

				// Add description if provided
				if (description) {
					agentCard.description = description;
				}

				// Process capabilities
				if (capabilities && capabilities.capability) {
					agentCard.capabilities = capabilities.capability.map((cap: any) => cap.name);
					
					// Build service endpoints based on capabilities
					capabilities.capability.forEach((cap: any) => {
						if (cap.name) {
							agentCard.serviceEndpoint[cap.name] = `${endpointBaseUrl}/${cap.name}`;
						}
					});
				}

				// Process security schemes
				if (securitySchemes && securitySchemes.scheme) {
					agentCard.securitySchemes = {};
					securitySchemes.scheme.forEach((scheme: any) => {
						if (scheme.name) {
							agentCard.securitySchemes[scheme.name] = {
								type: scheme.type,
							};
							
							if (scheme.type === 'apiKey') {
								agentCard.securitySchemes[scheme.name].in = scheme.in;
								agentCard.securitySchemes[scheme.name].name = scheme.name;
							}
						}
					});
				}

				// Process extensions
				if (extensions && extensions.extension) {
					agentCard.extensions = {};
					extensions.extension.forEach((ext: any) => {
						if (ext.name && ext.value) {
							agentCard.extensions[ext.name] = ext.value;
						}
					});
				}

				// Process additional fields
				if (additionalFields && additionalFields.field) {
					additionalFields.field.forEach((field: any) => {
						if (field.name && field.value) {
							agentCard[field.name] = field.value;
						}
					});
				}

				// Add schema version for internal tracking
				agentCard.schemaVersion = '1.0';

				returnData.push({
					json: agentCard,
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
