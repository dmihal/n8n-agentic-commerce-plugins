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
				displayName: 'Protocol Version',
				name: 'protocolVersion',
				type: 'string',
				default: '0.3.0',
				required: true,
				description: 'A2A protocol version supported by this agent',
			},
			{
				displayName: 'Agent Name',
				name: 'name',
				type: 'string',
				default: '',
				required: true,
				description: 'Human-readable name of the agent',
				placeholder: 'My n8n Agent',
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
				displayName: 'Primary URL',
				name: 'url',
				type: 'string',
				default: '',
				required: true,
				description: 'Primary endpoint URL for interacting with the agent',
				placeholder: 'https://example.com/webhook/a2a',
			},
			{
				displayName: 'Preferred Transport',
				name: 'preferredTransport',
				type: 'options',
				options: [
					{
						name: 'JSON-RPC',
						value: 'JSONRPC',
					},
					{
						name: 'gRPC',
						value: 'GRPC',
					},
					{
						name: 'HTTP+JSON/REST',
						value: 'HTTPJSON',
					},
				],
				default: 'JSONRPC',
				description: 'Transport protocol for the primary endpoint',
			},
			{
				displayName: 'Skills',
				name: 'skills',
				type: 'fixedCollection',
				default: {},
				required: true,
				description: 'List of agent skills/capabilities',
				typeOptions: {
					multipleValues: true,
				},
				options: [
					{
						name: 'skill',
						displayName: 'Skill',
						values: [
							{
								displayName: 'Skill ID',
								name: 'id',
								type: 'string',
								default: '',
								description: 'Unique identifier for the skill',
								placeholder: 'message-send',
							},
							{
								displayName: 'Skill Name',
								name: 'name',
								type: 'string',
								default: '',
								description: 'Human-readable name of the skill',
								placeholder: 'Send Message',
							},
							{
								displayName: 'Skill Description',
								name: 'description',
								type: 'string',
								default: '',
								description: 'Description of what this skill does',
								placeholder: 'Sends messages to the agent',
							},
							{
								displayName: 'Input Modes',
								name: 'inputModes',
								type: 'multiOptions',
								options: [
									{
										name: 'text/plain',
										value: 'text/plain',
									},
									{
										name: 'application/json',
										value: 'application/json',
									},
									{
										name: 'text/markdown',
										value: 'text/markdown',
									},
								],
								default: ['text/plain'],
								description: 'Supported input MIME types for this skill',
							},
							{
								displayName: 'Output Modes',
								name: 'outputModes',
								type: 'multiOptions',
								options: [
									{
										name: 'text/plain',
										value: 'text/plain',
									},
									{
										name: 'application/json',
										value: 'application/json',
									},
									{
										name: 'text/markdown',
										value: 'text/markdown',
									},
								],
								default: ['text/plain'],
								description: 'Supported output MIME types for this skill',
							},
						],
					},
				],
			},
			{
				displayName: 'Default Input Modes',
				name: 'defaultInputModes',
				type: 'multiOptions',
				options: [
					{
						name: 'text/plain',
						value: 'text/plain',
					},
					{
						name: 'application/json',
						value: 'application/json',
					},
					{
						name: 'text/markdown',
						value: 'text/markdown',
					},
				],
				default: ['text/plain'],
				description: 'Default supported input MIME types for all skills',
			},
			{
				displayName: 'Default Output Modes',
				name: 'defaultOutputModes',
				type: 'multiOptions',
				options: [
					{
						name: 'text/plain',
						value: 'text/plain',
					},
					{
						name: 'application/json',
						value: 'application/json',
					},
					{
						name: 'text/markdown',
						value: 'text/markdown',
					},
				],
				default: ['text/plain'],
				description: 'Default supported output MIME types for all skills',
			},
			{
				displayName: 'Security Requirements',
				name: 'security',
				type: 'fixedCollection',
				default: {},
				required: false,
				description: 'Security requirements following OpenAPI 3.0 format',
				typeOptions: {
					multipleValues: true,
				},
				options: [
					{
						name: 'requirement',
						displayName: 'Security Requirement',
						values: [
							{
								displayName: 'Security Schemes',
								name: 'schemes',
								type: 'multiOptions',
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
									{
										name: 'Bearer Token',
										value: 'bearer',
									},
								],
								default: [],
								description: 'Security schemes that can be used together',
							},
							{
								displayName: 'Scopes',
								name: 'scopes',
								type: 'string',
								default: '',
								description: 'Comma-separated list of scopes (for OAuth2)',
								placeholder: 'read,write',
							},
						],
					},
				],
			},
			{
				displayName: 'Additional Interfaces',
				name: 'interfaces',
				type: 'fixedCollection',
				default: {},
				required: false,
				description: 'Additional supported interfaces with different transports',
				typeOptions: {
					multipleValues: true,
				},
				options: [
					{
						name: 'interface',
						displayName: 'Interface',
						values: [
							{
								displayName: 'URL',
								name: 'url',
								type: 'string',
								default: '',
								description: 'URL for this interface',
								placeholder: 'https://example.com/grpc',
							},
							{
								displayName: 'Transport',
								name: 'transport',
								type: 'options',
								options: [
									{
										name: 'JSON-RPC',
										value: 'JSONRPC',
									},
									{
										name: 'gRPC',
										value: 'GRPC',
									},
									{
										name: 'HTTP+JSON/REST',
										value: 'HTTPJSON',
									},
								],
								default: 'JSONRPC',
								description: 'Transport protocol for this interface',
							},
						],
					},
				],
			},
			{
				displayName: 'Supports Authenticated Extended Card',
				name: 'supportsAuthenticatedExtendedCard',
				type: 'boolean',
				default: false,
				description: 'Whether the agent can provide an extended agent card to authenticated users',
			},
			{
				displayName: 'Icon URL',
				name: 'iconUrl',
				type: 'string',
				default: '',
				required: false,
				description: 'URL to an icon for the agent',
				placeholder: 'https://example.com/icon.png',
			},
			{
				displayName: 'Extensions',
				name: 'extensions',
				type: 'fixedCollection',
				default: {},
				required: false,
				description: 'Protocol extensions supported by this agent',
				typeOptions: {
					multipleValues: true,
				},
				options: [
					{
						name: 'extension',
						displayName: 'Extension',
						values: [
							{
								displayName: 'Extension Type',
								name: 'type',
								type: 'options',
								options: [
									{
										name: 'AP2 (Agent Payments Protocol)',
										value: 'ap2',
									},
									{
										name: 'Custom Extension',
										value: 'custom',
									},
								],
								default: 'ap2',
								description: 'Type of extension to configure',
							},
							{
								displayName: 'Custom Extension URI',
								name: 'customUri',
								type: 'string',
								default: '',
								description: 'Custom extension URI',
								placeholder: 'https://example.com/my-extension/v1.0',
								displayOptions: {
									show: {
										type: ['custom'],
									},
								},
							},
							{
								displayName: 'Extension Description',
								name: 'description',
								type: 'string',
								default: '',
								description: 'Description of what this extension enables',
								placeholder: 'This agent can process payments on behalf of users',
							},
							{
								displayName: 'AP2 Roles',
								name: 'ap2Roles',
								type: 'multiOptions',
								options: [
									{
										name: 'Merchant',
										value: 'merchant',
									},
									{
										name: 'Shopper',
										value: 'shopper',
									},
									{
										name: 'Credentials Provider',
										value: 'credentials-provider',
									},
									{
										name: 'Payment Processor',
										value: 'payment-processor',
									},
								],
								default: [],
								description: 'AP2 roles this agent performs',
								displayOptions: {
									show: {
										type: ['ap2'],
									},
								},
							},
							{
								displayName: 'Required Extension',
								name: 'required',
								type: 'boolean',
								default: false,
								description: 'Whether clients must support this extension to use the agent',
							},
							{
								displayName: 'Custom Parameters',
								name: 'customParams',
								type: 'fixedCollection',
								default: {},
								required: false,
								description: 'Custom parameters for the extension',
								typeOptions: {
									multipleValues: true,
								},
								options: [
									{
										name: 'param',
										displayName: 'Parameter',
										values: [
											{
												displayName: 'Parameter Name',
												name: 'name',
												type: 'string',
												default: '',
												description: 'Name of the parameter',
											},
											{
												displayName: 'Parameter Value',
												name: 'value',
												type: 'string',
												default: '',
												description: 'Value of the parameter',
											},
										],
									},
								],
								displayOptions: {
									show: {
										type: ['custom'],
									},
								},
							},
						],
					},
				],
			},
			{
				displayName: 'Signatures',
				name: 'signatures',
				type: 'fixedCollection',
				default: {},
				required: false,
				description: 'JSON Web Signatures for verifying AgentCard integrity',
				typeOptions: {
					multipleValues: true,
				},
				options: [
					{
						name: 'signature',
						displayName: 'Signature',
						values: [
							{
								displayName: 'Protected Header',
								name: 'protected',
								type: 'string',
								default: '',
								description: 'Base64url-encoded protected header',
								placeholder: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9',
							},
							{
								displayName: 'Signature',
								name: 'signature',
								type: 'string',
								default: '',
								description: 'Base64url-encoded signature',
								placeholder: 'signature_value_here',
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
				const protocolVersion = this.getNodeParameter('protocolVersion', i) as string;
				const name = this.getNodeParameter('name', i) as string;
				const description = this.getNodeParameter('description', i) as string;
				const url = this.getNodeParameter('url', i) as string;
				const preferredTransport = this.getNodeParameter('preferredTransport', i) as string;
				const skills = this.getNodeParameter('skills', i) as any;
				const defaultInputModes = this.getNodeParameter('defaultInputModes', i) as string[];
				const defaultOutputModes = this.getNodeParameter('defaultOutputModes', i) as string[];
				const security = this.getNodeParameter('security', i) as any;
				const interfaces = this.getNodeParameter('interfaces', i) as any;
				const supportsAuthenticatedExtendedCard = this.getNodeParameter('supportsAuthenticatedExtendedCard', i) as boolean;
				const iconUrl = this.getNodeParameter('iconUrl', i) as string;
				const extensions = this.getNodeParameter('extensions', i) as any;
				const signatures = this.getNodeParameter('signatures', i) as any;

				// Build the A2A-compliant agent card JSON
				const agentCard: any = {
					protocolVersion: protocolVersion,
					name: name,
					url: url,
					preferredTransport: preferredTransport,
					defaultInputModes: defaultInputModes,
					defaultOutputModes: defaultOutputModes,
					skills: [],
				};

				// Add description if provided
				if (description) {
					agentCard.description = description;
				}

				// Process skills
				if (skills && skills.skill) {
					agentCard.skills = skills.skill.map((skill: any) => ({
						id: skill.id,
						name: skill.name,
						description: skill.description,
						inputModes: skill.inputModes || defaultInputModes,
						outputModes: skill.outputModes || defaultOutputModes,
					}));
				}

				// Process security requirements
				if (security && security.requirement) {
					agentCard.security = security.requirement.map((req: any) => {
						const securityReq: any = {};
						if (req.schemes && req.schemes.length > 0) {
							req.schemes.forEach((scheme: string) => {
								if (scheme === 'oauth2' && req.scopes) {
									securityReq[scheme] = req.scopes.split(',').map((s: string) => s.trim());
								} else {
									securityReq[scheme] = [];
								}
							});
						}
						return securityReq;
					});
				}

				// Process additional interfaces
				if (interfaces && interfaces.interface) {
					agentCard.interfaces = interfaces.interface.map((intf: any) => ({
						url: intf.url,
						transport: intf.transport,
					}));
				}

				// Add optional fields
				if (supportsAuthenticatedExtendedCard) {
					agentCard.supportsAuthenticatedExtendedCard = supportsAuthenticatedExtendedCard;
				}

				if (iconUrl) {
					agentCard.iconUrl = iconUrl;
				}

				// Process extensions
				if (extensions && extensions.extension) {
					agentCard.extensions = extensions.extension.map((ext: any) => {
						const extension: any = {
							uri: ext.type === 'ap2' ? 'https://github.com/google-agentic-commerce/ap2/tree/v0.1' : ext.customUri,
						};

						if (ext.description) {
							extension.description = ext.description;
						}

						if (ext.required) {
							extension.required = ext.required;
						}

						// Build params based on extension type
						if (ext.type === 'ap2' && ext.ap2Roles && ext.ap2Roles.length > 0) {
							extension.params = {
								roles: ext.ap2Roles,
							};
						} else if (ext.type === 'custom' && ext.customParams && ext.customParams.param) {
							extension.params = {};
							ext.customParams.param.forEach((param: any) => {
								if (param.name && param.value) {
									extension.params[param.name] = param.value;
								}
							});
						}

						return extension;
					});
				}

				// Process signatures
				if (signatures && signatures.signature) {
					agentCard.signatures = signatures.signature.map((sig: any) => ({
						protected: sig.protected,
						signature: sig.signature,
					}));
				}

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
