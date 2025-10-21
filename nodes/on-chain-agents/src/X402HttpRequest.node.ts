import { ethers } from 'ethers';
import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

interface ERC3009Domain {
	name: string;
	version: string;
	chainId: number;
	verifyingContract: string;
}

interface TransferWithAuthorization {
	from: string;
	to: string;
	value: string;
	validAfter: string;
	validBefore: string;
	nonce: string;
}

async function signTransferAuthorization(wallet: ethers.Wallet, provider: ethers.Provider, {
	asset,
	toAddress,
	amount,
}: {
	asset: string;
	toAddress: string;
	amount: string;
}) {
	// Fetch token name dynamically
	let tokenName: string;
	try {
		const abi = ['function name() view returns (string)'];
		const contract = new ethers.Contract(asset, abi, provider);
		tokenName = await contract.name();
	} catch (error) {
		throw new Error(`Failed to fetch token name: ${error instanceof Error ? error.message : String(error)}. Make sure the contract supports the ERC-20 name() function.`);
	}

	const chainId = await provider.getNetwork().then((network) => Number(network.chainId));
	const validAfter = Math.floor(Date.now() / 1000);
	const validBefore = validAfter + 3600; // 1 hour
	const nonce = ethers.keccak256(ethers.toUtf8Bytes(Math.random().toString()));

	// Define ERC-3009 domain according to EIP-3009
	const domain: ERC3009Domain = {
		name: tokenName,
		version: '2', // ERC-3009 version
		chainId: chainId,
		verifyingContract: asset,
	};

	// Define ERC-3009 types according to EIP-3009
	const types = {
		TransferWithAuthorization: [
			{ name: 'from', type: 'address' },
			{ name: 'to', type: 'address' },
			{ name: 'value', type: 'uint256' },
			{ name: 'validAfter', type: 'uint256' },
			{ name: 'validBefore', type: 'uint256' },
			{ name: 'nonce', type: 'bytes32' },
		],
	};

	// Create the transfer authorization message
	const message: TransferWithAuthorization = {
		from: wallet.address,
		to: toAddress,
		value: amount,
		validAfter: validAfter.toString(),
		validBefore: validBefore.toString(),
		nonce: nonce,
	};
	const signature = await wallet.signTypedData(domain, types, message);
	return {
		signature,
		message,
	};
}

async function generatePaymentPayload(body: any, evmPrivateKey: string) {					
	// Validate and normalize private key
	evmPrivateKey = evmPrivateKey.trim();
	if (!evmPrivateKey.startsWith('0x')) {
		evmPrivateKey = '0x' + evmPrivateKey;
	}
	
	if (!/^0x[0-9a-fA-F]{64}$/.test(evmPrivateKey)) {
		throw new Error('Invalid private key format');
	}

	const provider = new ethers.JsonRpcProvider('https://sepolia.base.org/');
	let wallet: ethers.Wallet;
	try {
		wallet = new ethers.Wallet(evmPrivateKey, provider);
	} catch (error) {
		throw new Error(`Invalid private key: ${error instanceof Error ? error.message : String(error)}`);
	}

	// Find the first accepted payment scheme in body.accepts
	const accept = Array.isArray(body.accepts) && body.accepts.length > 0 ? body.accepts[0] : null;
	if (!accept) {
		throw new Error('No acceptable payment scheme found in response');
	}

	const { asset, payTo: toAddress, maxAmountRequired: amount } = accept;
	if (!asset || !toAddress || !amount) {
		throw new Error('Missing required fields in x402 payment accept object');
	}

	const { signature, message } = await signTransferAuthorization(wallet, provider, {
		asset,
		toAddress,
		amount,
	});

	return {
		x402Version: 1,
		scheme: 'exact',
		network: accept.network,
		payload: {
			signature,
			authorization: message,
		},
	};
}

export class X402HttpRequest implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'X402 HTTP Request',
		name: 'x402HttpRequest',
		icon: 'file:x402-http-request.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["method"] + " " + $parameter["url"]}}',
		description: 'Make HTTP requests with automatic x402 payment handling',
		defaults: {
			name: 'X402 HTTP Request',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'evmPrivateKey',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Method',
				name: 'method',
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
					{
						name: 'HEAD',
						value: 'HEAD',
					},
					{
						name: 'OPTIONS',
						value: 'OPTIONS',
					},
				],
				default: 'GET',
				description: 'The HTTP method to use',
			},
			{
				displayName: 'URL',
				name: 'url',
				type: 'string',
				default: '',
				placeholder: 'https://api.example.com/endpoint',
				description: 'The URL to make the request to',
				required: true,
			},
			{
				displayName: 'URL Parameters',
				name: 'urlParameters',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				default: {},
				placeholder: 'Add Parameter',
				options: [
					{
						name: 'parameters',
						displayName: 'Parameter',
						values: [
							{
								displayName: 'Name',
								name: 'name',
								type: 'string',
								default: '',
								description: 'Name of the parameter',
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: '',
								description: 'Value of the parameter',
							},
						],
					},
				],
				description: 'URL parameters to send with the request',
			},
			{
				displayName: 'Headers',
				name: 'headers',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				default: {},
				placeholder: 'Add Header',
				options: [
					{
						name: 'header',
						displayName: 'Header',
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
				description: 'Headers to send with the request',
			},
			{
				displayName: 'Body',
				name: 'body',
				type: 'json',
				default: '',
				description: 'JSON body to send with the request (for POST, PUT, PATCH)',
				displayOptions: {
					show: {
						method: ['POST', 'PUT', 'PATCH'],
					},
				},
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Timeout',
						name: 'timeout',
						type: 'number',
						default: 10000,
						description: 'Request timeout in milliseconds',
					},
					{
						displayName: 'Follow Redirects',
						name: 'followRedirects',
						type: 'boolean',
						default: true,
						description: 'Whether to follow HTTP redirects',
					},
					{
						displayName: 'Max Redirects',
						name: 'maxRedirects',
						type: 'number',
						default: 5,
						description: 'Maximum number of redirects to follow',
						displayOptions: {
							show: {
								followRedirects: [true],
							},
						},
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
				const method = this.getNodeParameter('method', i) as string;
				const canHaveBody = ['POST', 'PUT', 'PATCH'].includes(method);

				const url = this.getNodeParameter('url', i) as string;
				const urlParameters = this.getNodeParameter('urlParameters', i) as any;
				const headers = this.getNodeParameter('headers', i) as any;
				const body = canHaveBody ? this.getNodeParameter('body', i) as string : undefined;
				const options = this.getNodeParameter('options', i) as any;

				// Build URL with parameters
				let requestUrl = url;
				if (urlParameters?.parameters?.length > 0) {
					const urlParams = new URLSearchParams();
					for (const param of urlParameters.parameters) {
						if (param.name && param.value !== undefined) {
							urlParams.append(param.name, param.value);
						}
					}
					const separator = url.includes('?') ? '&' : '?';
					requestUrl = `${url}${separator}${urlParams.toString()}`;
				}

				// Build headers object
				const requestHeaders: Record<string, string> = {
					'Content-Type': 'application/json',
				};
				if (headers?.header?.length > 0) {
					for (const header of headers.header) {
						if (header.name && header.value !== undefined) {
							requestHeaders[header.name] = header.value;
						}
					}
				}

				// Prepare request options
				const requestOptions: RequestInit = {
					method,
					headers: requestHeaders,
					signal: AbortSignal.timeout(options.timeout || 10000),
				};

				// Add body for methods that support it
				if (canHaveBody && body) {
					try {
						requestOptions.body = JSON.stringify(JSON.parse(body));
					} catch (error) {
						const errorMessage = error instanceof Error ? error.message : 'Unknown error';
						throw new NodeOperationError(this.getNode(), `Invalid JSON body: ${errorMessage}`);
					}
				}

				// Make the initial request
				let response = await fetch(requestUrl, requestOptions);
				let responseData: any = {};
				let paymentResponse: any = null;

				// Check if we got a 402 Payment Required response
				if (response.status === 402) {
					const responseBody: any = await response.json();

					const credentials = await this.getCredentials('evmPrivateKey', i);
					if (!credentials?.privateKey) {
						throw new NodeOperationError(this.getNode(), 'Private key is required for write operations');
					}
					
					const paymentPayload = await generatePaymentPayload(responseBody, credentials.privateKey as string);

					const paymentPayloadHeader = Buffer.from(JSON.stringify(paymentPayload)).toString('base64');
					
					// Add X-PAYMENT header and retry the request
					const retryHeaders = { ...requestHeaders };
					retryHeaders['X-PAYMENT'] = paymentPayloadHeader;
					
					const retryOptions: RequestInit = {
						...requestOptions,
						headers: retryHeaders,
					};

					// Make the retry request with payment header
					response = await fetch(requestUrl, retryOptions);

					// Extract X-PAYMENT-RESPONSE header if present
					const paymentResponseHeader = response.headers.get('X-PAYMENT-RESPONSE');
					if (paymentResponseHeader) {
						try {
							const decodedPaymentResponse = Buffer.from(paymentResponseHeader, 'base64').toString('utf-8');
							paymentResponse = JSON.parse(decodedPaymentResponse);
						} catch (error) {
							const errorMessage = error instanceof Error ? error.message : 'Unknown error';
							// If decoding fails, store the raw header value
							paymentResponse = { raw: paymentResponseHeader, error: `Failed to decode payment response: ${errorMessage}` };
						}
					} else {
						throw new NodeOperationError(this.getNode(), 'No payment response header found');
					}
				}

				// Parse response body
				const contentType = response.headers.get('content-type');
				if (contentType?.includes('application/json')) {
					try {
						responseData = await response.json();
					} catch (error) {
						const errorMessage = error instanceof Error ? error.message : 'Unknown error';
						responseData = { error: `Failed to parse JSON response: ${errorMessage}` };
					}
				} else {
					responseData = await response.text();
				}

				// Prepare the return data
				const returnItem: INodeExecutionData = {
					json: {
						status: response.status,
						statusText: response.statusText,
						headers: Object.fromEntries(response.headers.entries()),
						data: responseData,
						url: requestUrl,
						method,
						paymentResponse,
					},
				};

				returnData.push(returnItem);
			} catch (error) {
				console.error(error);
				const errorMessage = error instanceof Error ? error.message : 'Unknown error';
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: errorMessage,
						},
					});
					continue;
				}
				throw new NodeOperationError(this.getNode(), errorMessage);
			}
		}

		return [returnData];
	}
}
