import type {
	IDataObject,
	IExecuteFunctions,
	IN8nHttpFullResponse,
	IN8nHttpResponse,
	INodeExecutionData,
	INodeProperties,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeOperationError, NodeConnectionTypes, jsonParse } from 'n8n-workflow';
import { CHAIN_CONFIGS } from './chainConfig';

export class X402HttpResponse implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'x402 HTTP Response',
		name: 'x402HttpResponse',
		icon: 'file:x402-icon-blue.png',
		group: ['transform'],
		version: 1,
		description: 'Responds to X402 HTTP Endpoint triggers with either a 402 Payment Required error or a successful response',
		defaults: {
			name: 'X402 HTTP Response',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		properties: [
			{
				displayName: 'Response Mode',
				name: 'responseMode',
				type: 'options',
				options: [
					{
						name: '402 Payment Required',
						value: 'paymentRequired',
						description: 'Respond with a 402 Payment Required error',
					},
					{
						name: 'Success Response',
						value: 'success',
						description: 'Respond with a successful HTTP response',
					},
				],
				default: 'success',
				description: 'The type of response to send',
			},
			{
				displayName: 'Payment Required Message',
				name: 'paymentRequiredMessage',
				type: 'string',
				default: 'Payment required to access this resource',
				displayOptions: {
					show: {
						responseMode: ['paymentRequired'],
					},
				},
				description: 'The error message to include in the 402 response',
			},
			{
				displayName: 'Asset Address',
				name: 'assetAddress',
				type: 'string',
				default: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
				displayOptions: {
					show: {
						responseMode: ['paymentRequired'],
					},
				},
				description: 'The contract address of the token to accept as payment',
			},
			{
				displayName: 'Pay To Address',
				name: 'payToAddress',
				type: 'string',
				default: '0x209693Bc6afc0C5328bA36FaF03C514EF312287C',
				displayOptions: {
					show: {
						responseMode: ['paymentRequired'],
					},
				},
				description: 'The address to receive the payment',
			},
			{
				displayName: 'Amount Required',
				name: 'amountRequired',
				type: 'string',
				default: '10000',
				displayOptions: {
					show: {
						responseMode: ['paymentRequired'],
					},
				},
				description: 'The amount of tokens required for payment (in smallest unit)',
			},
			{
				displayName: 'Network',
				name: 'network',
				type: 'options',
				options: CHAIN_CONFIGS.map(chain => ({
					name: chain.name,
					value: chain.name.toLowerCase().replace(/\s+/g, '-'),
				})),
				default: 'base-sepolia-testnet',
				displayOptions: {
					show: {
						responseMode: ['paymentRequired'],
					},
				},
				description: 'The blockchain network for the payment',
			},
			{
				displayName: 'Resource URL',
				name: 'resourceUrl',
				type: 'string',
				default: 'https://api.example.com/premium-data',
				displayOptions: {
					show: {
						responseMode: ['paymentRequired'],
					},
				},
				description: 'The URL of the resource being protected',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: 'Access to premium market data',
				displayOptions: {
					show: {
						responseMode: ['paymentRequired'],
					},
				},
				description: 'Description of what the payment provides access to',
			},
			{
				displayName: 'Response Data',
				name: 'responseData',
				type: 'options',
				options: [
					{
						name: 'All Incoming Items',
						value: 'allIncomingItems',
						description: 'Respond with all input JSON items',
					},
					{
						name: 'First Incoming Item',
						value: 'firstIncomingItem',
						description: 'Respond with the first input JSON item',
					},
					{
						name: 'JSON',
						value: 'json',
						description: 'Respond with a custom JSON body',
					},
					{
						name: 'Text',
						value: 'text',
						description: 'Respond with a simple text message body',
					},
					{
						name: 'No Data',
						value: 'noData',
						description: 'Respond with an empty body',
					},
				],
				default: 'firstIncomingItem',
				displayOptions: {
					show: {
						responseMode: ['success'],
					},
				},
				description: 'The data that should be returned in the success response',
			},
			{
				displayName: 'Response Body',
				name: 'responseBody',
				type: 'json',
				displayOptions: {
					show: {
						responseMode: ['success'],
						responseData: ['json'],
					},
				},
				default: '{\n  "status": "success",\n  "message": "Request processed successfully"\n}',
				typeOptions: {
					rows: 4,
				},
				description: 'The HTTP response JSON data',
			},
			{
				displayName: 'Response Body',
				name: 'responseBody',
				type: 'string',
				displayOptions: {
					show: {
						responseMode: ['success'],
						responseData: ['text'],
					},
				},
				typeOptions: {
					rows: 2,
				},
				default: 'Request processed successfully',
				description: 'The HTTP response text data',
			},
			{
				displayName: 'Response Key',
				name: 'responseKey',
				type: 'string',
				displayOptions: {
					show: {
						responseMode: ['success'],
						responseData: ['allIncomingItems', 'firstIncomingItem'],
					},
				},
				default: '',
				description: 'The name of the response field to put all items in',
				placeholder: 'e.g. data',
			},
			{
				displayName: 'Transaction Hash',
				name: 'transactionHash',
				type: 'string',
				displayOptions: {
					show: {
						responseMode: ['success'],
					},
				},
				default: '',
				description: 'The transaction hash of the successful payment',
				placeholder: '0x1234567890abcdef...',
			},
			{
				displayName: 'Network',
				name: 'successNetwork',
				type: 'options',
				options: CHAIN_CONFIGS.map(chain => ({
					name: chain.name,
					value: chain.name.toLowerCase().replace(/\s+/g, '-'),
				})),
				default: 'base-sepolia-testnet',
				displayOptions: {
					show: {
						responseMode: ['success'],
					},
				},
				description: 'The blockchain network where the payment was processed',
			},
			{
				displayName: 'Payer Address',
				name: 'payerAddress',
				type: 'string',
				displayOptions: {
					show: {
						responseMode: ['success'],
					},
				},
				default: '',
				description: 'The address of the account that made the payment',
				placeholder: '0x857b06519E91e3A54538791bDbb0E22373e36b66',
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add option',
				default: {},
				options: [
					{
						displayName: 'Response Code',
						name: 'responseCode',
						type: 'number',
						typeOptions: {
							minValue: 200,
							maxValue: 599,
						},
						default: 200,
						description: 'The HTTP response code to return for success responses. Defaults to 200.',
						displayOptions: {
							show: {
								'/responseMode': ['success'],
							},
						},
					},
					{
						displayName: 'Response Headers',
						name: 'responseHeaders',
						placeholder: 'Add Response Header',
						description: 'Add headers to the HTTP response',
						type: 'fixedCollection',
						typeOptions: {
							multipleValues: true,
						},
						default: {},
						options: [
							{
								name: 'entries',
								displayName: 'Entries',
								values: [
									{
										displayName: 'Name',
										name: 'name',
										type: 'string',
										default: '',
										description: 'Name of the header',
									},
									{
										displayName: 'Value',
										name: 'value',
										type: 'string',
										default: '',
										description: 'Value of the header',
									},
								],
							},
						],
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const responseMode = this.getNodeParameter('responseMode', 0) as string;
		const options = this.getNodeParameter('options', 0, {}) as IDataObject;

		let response: IN8nHttpFullResponse;

		try {
			const headers = {} as IDataObject;

			// Add custom headers if provided
			if (options.responseHeaders) {
				for (const header of (options.responseHeaders as IDataObject).entries as IDataObject[]) {
					if (typeof header.name !== 'string') {
						header.name = header.name?.toString();
					}
					headers[header.name?.toLowerCase() as string] = header.value?.toString();
				}
			}

			if (responseMode === 'paymentRequired') {
				// Respond with 402 Payment Required
				const message = this.getNodeParameter('paymentRequiredMessage', 0) as string;
				const assetAddress = this.getNodeParameter('assetAddress', 0) as string;
				const payToAddress = this.getNodeParameter('payToAddress', 0) as string;
				const amountRequired = this.getNodeParameter('amountRequired', 0) as string;
				const network = this.getNodeParameter('network', 0) as string;
				const resourceUrl = this.getNodeParameter('resourceUrl', 0) as string;
				const description = this.getNodeParameter('description', 0) as string;

				// Map network names to their proper format
				const networkMap: { [key: string]: string } = {
					'ethereum-mainnet': 'ethereum',
					'polygon': 'polygon',
					'base': 'base',
					'sepolia-testnet': 'sepolia',
					'base-sepolia-testnet': 'base-sepolia',
				};

				const mappedNetwork = networkMap[network] || network;
				
				response = {
					body: {
						x402Version: 1,
						error: message,
						accepts: [
							{
								scheme: 'exact',
								network: mappedNetwork,
								maxAmountRequired: amountRequired,
								asset: assetAddress,
								payTo: payToAddress,
								resource: resourceUrl,
								description: description,
								mimeType: 'application/json',
								outputSchema: null,
								maxTimeoutSeconds: 60,
								extra: {
									name: 'USDC',
									version: '2'
								}
							}
						]
					},
					headers: {
						...headers,
						'content-type': 'application/json',
					},
					statusCode: 402,
				};
			} else {
				// Success response
				const responseData = this.getNodeParameter('responseData', 0) as string;
				let statusCode = (options.responseCode as number) || 200;
				let responseBody: IN8nHttpResponse;

				if (responseData === 'json') {
					const responseBodyParameter = this.getNodeParameter('responseBody', 0) as string;
					if (responseBodyParameter) {
						if (typeof responseBodyParameter === 'object') {
							responseBody = responseBodyParameter;
						} else {
							try {
								responseBody = jsonParse(responseBodyParameter);
							} catch (error) {
								throw new NodeOperationError(this.getNode(), error as Error, {
									message: "Invalid JSON in 'Response Body' field",
									description: "Check that the syntax of the JSON in the 'Response Body' parameter is valid",
								});
							}
						}
					} else {
						responseBody = {};
					}
				} else if (responseData === 'text') {
					const rawBody = this.getNodeParameter('responseBody', 0) as string;
					responseBody = rawBody;
					headers['content-type'] = 'text/plain';
				} else if (responseData === 'allIncomingItems') {
					const respondItems = items.map((item) => item.json);
					const responseKey = this.getNodeParameter('responseKey', 0) as string;
					responseBody = responseKey ? { [responseKey]: respondItems } : respondItems;
				} else if (responseData === 'firstIncomingItem') {
					const responseKey = this.getNodeParameter('responseKey', 0) as string;
					responseBody = responseKey ? { [responseKey]: items[0].json } : items[0].json;
				} else if (responseData === 'noData') {
					responseBody = {};
				} else {
					throw new NodeOperationError(
						this.getNode(),
						`The Response Data option "${responseData}" is not supported!`,
					);
				}

				// Add X-PAYMENT-RESPONSE header for success responses
				const transactionHash = this.getNodeParameter('transactionHash', 0) as string;
				const successNetwork = this.getNodeParameter('successNetwork', 0) as string;
				const payerAddress = this.getNodeParameter('payerAddress', 0) as string;

				if (transactionHash && payerAddress) {
					// Map network names to their proper format
					const networkMap: { [key: string]: string } = {
						'ethereum-mainnet': 'ethereum',
						'polygon': 'polygon',
						'base': 'base',
						'sepolia-testnet': 'sepolia',
						'base-sepolia-testnet': 'base-sepolia',
					};

					const mappedNetwork = networkMap[successNetwork] || successNetwork;

					const paymentResponse = {
						success: true,
						transaction: transactionHash,
						network: mappedNetwork,
						payer: payerAddress,
					};

					// Encode the payment response as base64
					const paymentResponseJson = JSON.stringify(paymentResponse);
					const paymentResponseBase64 = Buffer.from(paymentResponseJson, 'utf8').toString('base64');
					
					headers['x-payment-response'] = paymentResponseBase64;
				}

				response = {
					body: responseBody,
					headers,
					statusCode,
				};
			}

			// Send the response
			this.sendResponse(response);

		} catch (error: any) {
			if (this.continueOnFail()) {
				const returnData = this.helpers.constructExecutionMetaData(
					[{ json: { error: error.message } }],
					{ itemData: { item: 0 } },
				);
				return [returnData];
			}
			throw error;
		}

		return [items];
	}
}
