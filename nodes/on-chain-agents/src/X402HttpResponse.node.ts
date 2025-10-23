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

export class X402HttpResponse implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'X402 HTTP Response',
		name: 'x402HttpResponse',
		icon: 'file:x402-http-response.svg',
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
				
				response = {
					body: {
						error: 'Payment Required',
						message: message,
						statusCode: 402,
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
