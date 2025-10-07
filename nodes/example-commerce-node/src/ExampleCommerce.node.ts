import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

export class ExampleCommerce implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Example Commerce',
		name: 'exampleCommerce',
		icon: 'file:example-commerce.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Example commerce operations',
		defaults: {
			name: 'Example Commerce',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'exampleCommerceApi',
				required: true,
			},
		],
		requestDefaults: {
			baseURL: 'https://api.example-commerce.com',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Product',
						value: 'product',
					},
					{
						name: 'Order',
						value: 'order',
					},
				],
				default: 'product',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['product'],
					},
				},
				options: [
					{
						name: 'Get',
						value: 'get',
						action: 'Get a product',
						description: 'Get a product by ID',
						routing: {
							request: {
								method: 'GET',
								url: '/products/{{$parameter["productId"]}}',
							},
						},
					},
					{
						name: 'List',
						value: 'list',
						action: 'List products',
						description: 'List all products',
						routing: {
							request: {
								method: 'GET',
								url: '/products',
							},
						},
					},
				],
				default: 'get',
			},
			{
				displayName: 'Product ID',
				name: 'productId',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['product'],
						operation: ['get'],
					},
				},
				default: '',
				required: true,
				description: 'The ID of the product to retrieve',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;

				if (resource === 'product') {
					if (operation === 'get') {
						const productId = this.getNodeParameter('productId', i) as string;
						
						const responseData = await this.helpers.requestWithAuthentication.call(
							this,
							'exampleCommerceApi',
							{
								method: 'GET',
								url: `/products/${productId}`,
							},
						);

						returnData.push({
							json: responseData,
						});
					} else if (operation === 'list') {
						const responseData = await this.helpers.requestWithAuthentication.call(
							this,
							'exampleCommerceApi',
							{
								method: 'GET',
								url: '/products',
							},
						);

						returnData.push({
							json: responseData,
						});
					}
				}
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
