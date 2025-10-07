import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class ExampleCommerceApi implements ICredentialType {
	name = 'exampleCommerceApi';
	displayName = 'Example Commerce API';
	documentationUrl = 'https://docs.example-commerce.com/api';
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
		},
		{
			displayName: 'Environment',
			name: 'environment',
			type: 'options',
			options: [
				{
					name: 'Sandbox',
					value: 'sandbox',
				},
				{
					name: 'Production',
					value: 'production',
				},
			],
			default: 'sandbox',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.example-commerce.com',
			url: '/auth/verify',
		},
	};
}
