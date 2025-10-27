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
		displayName: 'x402 HTTP Endpoint',
		name: 'x402HttpEndpoint',
		icon: 'file:x402-icon-blue.png',
		group: ['trigger'],
		version: 1,
		description: 'HTTP endpoint trigger for X402 protocol with payment validation. Routes request data to different outputs based on whether a valid X402 payment is provided in the X-PAYMENT header. Use downstream nodes to handle HTTP responses.',
		activationMessage: 'You can now make calls to your HTTP endpoint URL.',
		defaults: {
			name: 'X402 HTTP Endpoint',
		},
		triggerPanel: {
			header: 'Receive HTTP requests and validate X402 payments',
			executionsHelp: {
				inactive:
					'This endpoint validates X402 payments and routes request data to different outputs:\n\n**Payment Provided**: Triggered when a valid X402 payment is found in the X-PAYMENT header\n**Missing Payment**: Triggered when no valid payment is provided\n\n**Note**: This node only routes data - use downstream "Respond to Webhook" nodes to send HTTP responses.\n\n**Use test mode while you build your workflow**. Click the \'listen\' button, then make a request to the test URL. The executions will show up in the editor.\n\n**Use production mode to run your workflow automatically**. Activate the workflow, then make requests to the production URL. These executions will show up in the executions list, but not in the editor.',
				active:
					'This endpoint validates X402 payments and routes request data to different outputs:\n\n**Payment Provided**: Triggered when a valid X402 payment is found in the X-PAYMENT header\n**Missing Payment**: Triggered when no valid payment is provided\n\n**Note**: This node only routes data - use downstream "Respond to Webhook" nodes to send HTTP responses.\n\n**Use test mode while you build your workflow**. Click the \'listen\' button, then make a request to the test URL. The executions will show up in the editor.\n\n**Use production mode to run your workflow automatically**. Since the workflow is activated, you can make requests to the production URL. These executions will show up in the executions list, but not in the editor.',
			},
			activationHint: "Once you've finished building your workflow, run it without having to click this button by using the production endpoint URL.",
		},
		inputs: [],
		outputs: [
			{
				displayName: 'Payment Provided',
				type: 'main',
			},
			{
				displayName: 'Missing Payment',
				type: 'main',
			},
		],
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
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: '={{$parameter["httpMethod"]}}',
				responseMode: 'responseNode',
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

		// Check for X-PAYMENT header
		const xPaymentHeader = headerData['x-payment'] || headerData['X-PAYMENT'];
		let decodedPayment = null;
		let hasValidPayment = false;

		if (xPaymentHeader) {
			try {
				// Ensure we have a string value for the header
				const headerValue = Array.isArray(xPaymentHeader) ? xPaymentHeader[0] : xPaymentHeader;
				if (typeof headerValue === 'string') {
					// Decode base64 X-PAYMENT header
					const decodedBase64 = Buffer.from(headerValue, 'base64').toString('utf-8');
					decodedPayment = JSON.parse(decodedBase64);
				}
				
				// Basic validation - check if it has required x402 fields
				if (decodedPayment && 
					typeof decodedPayment === 'object' && 
					decodedPayment.x402Version && 
					decodedPayment.scheme && 
					decodedPayment.network && 
					decodedPayment.payload) {
					hasValidPayment = true;
				}
			} catch (error) {
				// Invalid base64 or JSON - treat as no payment
				hasValidPayment = false;
			}
		}

		// Prepare the output data
		const outputData = {
			headers: headerData,
			body: bodyData,
			method: this.getRequestObject().method,
			url: this.getRequestObject().url,
			query: this.getRequestObject().query,
			params: this.getRequestObject().params,
			hasValidPayment: hasValidPayment,
			...(hasValidPayment && { payment: decodedPayment }),
		};

		// Route to appropriate output based on payment status
		if (hasValidPayment) {
			// Payment provided - route to first output
			return {
				workflowData: [
					this.helpers.returnJsonArray([outputData]), // Payment Provided output
					[], // Missing Payment output (empty)
				],
			};
		} else {
			// Missing payment - route to second output
			return {
				workflowData: [
					[], // Payment Provided output (empty)
					this.helpers.returnJsonArray([outputData]), // Missing Payment output
				],
			};
		}
	}
}
