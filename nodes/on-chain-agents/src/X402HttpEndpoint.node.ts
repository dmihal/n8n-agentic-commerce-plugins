import type {
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
	IDataObject,
	INodeExecutionData,
} from 'n8n-workflow';
import { Node } from 'n8n-workflow';

export class X402HttpEndpoint extends Node {
	description: INodeTypeDescription = {
		displayName: 'X402 HTTP Endpoint',
		name: 'x402HttpEndpoint',
		icon: 'file:x402-http-request.svg',
		group: ['trigger'],
		version: 1,
		description: 'Simple HTTP endpoint trigger for X402 protocol',
		activationMessage: 'You can now make calls to your HTTP endpoint URL.',
		defaults: {
			name: 'X402 HTTP Endpoint',
		},
		triggerPanel: {
			header: 'Respond to HTTP requests, gated by X402 payments',
			executionsHelp: {
				inactive:
					'This endpoint has two modes: test and production.\n\n**Use test mode while you build your workflow**. Click the \'listen\' button, then make a request to the test URL. The executions will show up in the editor.\n\n**Use production mode to run your workflow automatically**. Activate the workflow, then make requests to the production URL. These executions will show up in the executions list, but not in the editor.',
				active:
					'This endpoint has two modes: test and production.\n\n**Use test mode while you build your workflow**. Click the \'listen\' button, then make a request to the test URL. The executions will show up in the editor.\n\n**Use production mode to run your workflow automatically**. Since the workflow is activated, you can make requests to the production URL. These executions will show up in the executions list, but not in the editor.',
			},
			activationHint: "Once you've finished building your workflow, run it without having to click this button by using the production endpoint URL.",
		},
		inputs: [],
		outputs: ['main'],
		credentials: [],
		properties: [
			{
				displayName: 'HTTP Method',
				name: 'httpMethod',
				type: 'options',
				options: [
					{
						name: 'GET',
						value: 'GET',
					},
					{
						name: 'POST',
						value: 'POST',
					},
					{
						name: 'PUT',
						value: 'PUT',
					},
					{
						name: 'PATCH',
						value: 'PATCH',
					},
					{
						name: 'DELETE',
						value: 'DELETE',
					},
				],
				default: 'POST',
				description: 'The HTTP method to listen for',
			},
			{
				displayName: 'Path',
				name: 'path',
				type: 'string',
				default: '',
				placeholder: 'x402-endpoint',
				required: true,
				description: 'The path for this HTTP endpoint',
			},
			{
				displayName: 'Response Data',
				name: 'responseData',
				type: 'string',
				default: '{"status": "success"}',
				description: 'The response data to return',
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: '={{$parameter["httpMethod"]}}',
				responseMode: 'onReceived',
				isFullPath: true,
				path: '={{$parameter["path"]}}',
				nodeType: 'webhook',
				ndvHideMethod: true,
				ndvHideUrl: false,
			},
		],
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const bodyData = this.getBodyData();
		const headerData = this.getHeaderData();
		const responseData = this.getNodeParameter('responseData', '') as string;

		// Prepare the output data
		const outputData = {
			headers: headerData,
			body: bodyData,
			method: this.getRequestObject().method,
			url: this.getRequestObject().url,
			query: this.getRequestObject().query,
			params: this.getRequestObject().params,
		};

		// Set response headers and send response
		const res = this.getResponseObject();
		res.setHeader('Content-Type', 'application/json');
		res.status(200).json(JSON.parse(responseData));

		return {
			workflowData: [this.helpers.returnJsonArray([outputData])],
		};
	}
}
