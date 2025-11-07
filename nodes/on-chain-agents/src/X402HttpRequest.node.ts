import { ethers } from 'ethers';
import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';
import { CHAIN_CONFIGS } from './chainConfig';
import { x402Response, PaymentRequirements, Network } from 'x402/types';

// Subset of PaymentRequirements that we actually use for generating payloads
type PaymentDetails = Pick<PaymentRequirements, 'asset' | 'payTo' | 'maxAmountRequired' | 'network'>;

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

async function callContract<T>(contractAddress: string, abi: any[], provider: ethers.Provider, functionName: string, ...args: any[]): Promise<T> {
	try {
		const contract = new ethers.Contract(contractAddress, abi, provider);
		return await contract[functionName](...args);
	} catch (error) {
		throw new Error(`Failed to call contract function: ${error instanceof Error ? error.message : String(error)}`);
	}
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
	const tokenName: string = await callContract<string>(asset, ['function name() view returns (string)'], provider, 'name');


	const chainId = await provider.getNetwork().then((network) => Number(network.chainId));
	const validAfter = Math.floor(Date.now() / 1000) - 60; // 1 minute ago
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


async function generatePaymentPayload(
	paymentDetails: PaymentDetails,
	evmPrivateKey: string
) {
	// Validate and normalize private key
	evmPrivateKey = evmPrivateKey.trim();
	if (!evmPrivateKey.startsWith('0x')) {
		evmPrivateKey = '0x' + evmPrivateKey;
	}

	if (!/^0x[0-9a-fA-F]{64}$/.test(evmPrivateKey)) {
		throw new Error('Invalid private key format');
	}

	const chainConfig = CHAIN_CONFIGS.find(chain => chain.id === paymentDetails.network);
	if (!chainConfig) {
		throw new Error(`Unsupported network: ${paymentDetails.network}`);
	}

	const provider = new ethers.JsonRpcProvider(chainConfig.rpcUrl);
	let wallet: ethers.Wallet;
	try {
		wallet = new ethers.Wallet(evmPrivateKey, provider);
	} catch (error) {
		throw new Error(`Invalid private key: ${error instanceof Error ? error.message : String(error)}`);
	}

	const balance = await callContract<string>(paymentDetails.asset, ['function balanceOf(address owner) view returns (uint256)'], provider, 'balanceOf', wallet.address);
	if (balance < paymentDetails.maxAmountRequired) {
		throw new Error(`Insufficient balance in wallet ${wallet.address}: ${balance} < ${paymentDetails.maxAmountRequired}`);
	}


	const { signature, message } = await signTransferAuthorization(wallet, provider, {
		asset: paymentDetails.asset,
		toAddress: paymentDetails.payTo,
		amount: paymentDetails.maxAmountRequired,
	});

	return {
		x402Version: 1,
		scheme: 'exact',
		network: paymentDetails.network,
		payload: {
			signature,
			authorization: message,
		},
	};
}

export class X402HttpRequest implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'x402 HTTP Request',
		name: 'x402HttpRequest',
		icon: 'file:x402-icon-blue.png',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["method"] + " " + $parameter["url"]}}',
		description: 'Make HTTP requests with automatic x402 payment handling',
		defaults: {
			name: 'X402 HTTP Request',
		},
		usableAsTool: true,
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
				displayName: 'Automatically fetch payment details',
				name: 'autoFetchPayment',
				type: 'boolean',
				default: true,
				description: 'Whether to automatically fetch payment details from the 402 response',
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
				description: 'The blockchain network for the payment',
				displayOptions: {
					show: {
						autoFetchPayment: [false],
					},
				},
			},
			{
				displayName: 'Amount',
				name: 'amount',
				type: 'string',
				default: '',
				description: 'The payment amount',
				displayOptions: {
					show: {
						autoFetchPayment: [false],
					},
				},
			},
			{
				displayName: 'Recipient Address',
				name: 'recipientAddress',
				type: 'string',
				default: '',
				description: 'The payment recipient address',
				displayOptions: {
					show: {
						autoFetchPayment: [false],
					},
				},
			},
			{
				displayName: 'Token Address',
				name: 'tokenAddress',
				type: 'string',
				default: '',
				description: 'The ERC-20 token contract address',
				displayOptions: {
					show: {
						autoFetchPayment: [false],
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
				const body = canHaveBody ? this.getNodeParameter('body', i) as any : undefined;
				const options = this.getNodeParameter('options', i) as any;
				const autoFetchPayment = this.getNodeParameter('autoFetchPayment', i) as boolean;

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
						requestOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
					} catch (error) {
						const errorMessage = error instanceof Error ? error.message : 'Unknown error';
						throw new NodeOperationError(this.getNode(), `Invalid JSON body: ${errorMessage}`);
					}
				}

				// Get credentials
				const credentials = await this.getCredentials('evmPrivateKey', i);
				if (!credentials?.privateKey) {
					throw new NodeOperationError(this.getNode(), 'Private key is required');
				}

				// Build payment details based on mode
				let paymentDetails: PaymentDetails | null = null;

				if (!autoFetchPayment) {
					// Manual mode: build payment details from user parameters before making request
					const network = this.getNodeParameter('network', i) as string;
					const amount = this.getNodeParameter('amount', i) as string;
					const recipientAddress = this.getNodeParameter('recipientAddress', i) as string;
					const tokenAddress = this.getNodeParameter('tokenAddress', i) as string;

					if (!network || !amount || !recipientAddress || !tokenAddress) {
						throw new NodeOperationError(this.getNode(), 'All payment parameters are required when auto-fetch is disabled');
					}

					// Map network names to their proper format
					const networkMap: { [key: string]: Network } = {
						'polygon': 'polygon',
						'base': 'base',
						'base-sepolia-testnet': 'base-sepolia',
					};

					const mappedNetwork = networkMap[network] || network;

					paymentDetails = {
						asset: tokenAddress,
						payTo: recipientAddress,
						maxAmountRequired: amount,
						network: mappedNetwork,
					};
				}

				let response: Response;
				let paymentResponse: any = null;

				// If we have manual payment details, add payment header immediately
				if (paymentDetails) {
					const paymentPayload = await generatePaymentPayload(paymentDetails, credentials.privateKey as string);
					const paymentPayloadHeader = Buffer.from(JSON.stringify(paymentPayload)).toString('base64');

					// Add X-PAYMENT header before making request
					requestHeaders['X-PAYMENT'] = paymentPayloadHeader;

					// Update request options with the payment header
					requestOptions.headers = requestHeaders;

					// Make the request with payment already included
					response = await fetch(requestUrl, requestOptions);

					if (response.status !== 200) {
						throw new NodeOperationError(this.getNode(), `Request failed with payment, returned status ${response.status} ${response.statusText}`);
					}

					// Extract X-PAYMENT-RESPONSE header if present
					const paymentResponseHeader = response.headers.get('X-PAYMENT-RESPONSE');
					if (paymentResponseHeader) {
						try {
							const decodedPaymentResponse = Buffer.from(paymentResponseHeader, 'base64').toString('utf-8');
							paymentResponse = JSON.parse(decodedPaymentResponse);
						} catch (error) {
							const errorMessage = error instanceof Error ? error.message : 'Unknown error';
							paymentResponse = { raw: paymentResponseHeader, error: `Failed to decode payment response: ${errorMessage}` };
						}
					}
				} else {
					// Auto-fetch mode: make initial request and handle 402
					response = await fetch(requestUrl, requestOptions);

					// Check if we got a 402 Payment Required response
					if (response.status === 402) {
						const responseBody = await response.json() as x402Response;
						console.log('responseBody', responseBody);

						// Find the first accepted payment scheme in response
						const accept = Array.isArray(responseBody.accepts) && responseBody.accepts.length > 0 ? responseBody.accepts[0] : null;
						if (!accept) {
							throw new Error('No acceptable payment scheme found in response');
						}

						const { asset, payTo, maxAmountRequired, network } = accept;
						if (!asset || !payTo || !maxAmountRequired || !network) {
							throw new Error('Missing required fields in x402 payment accept object');
						}

						paymentDetails = {
							asset,
							payTo,
							maxAmountRequired,
							network,
						};

						const paymentPayload = await generatePaymentPayload(paymentDetails!, credentials.privateKey as string);

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

						if (response.status === 402) {
							const retryBody = await response.json() as any;
							throw new NodeOperationError(this.getNode(), `Payment failed, 402 ${retryBody.error ? ` with error: ${retryBody.error}` : ''}`);
						}

						if (response.status !== 200) {
							throw new NodeOperationError(this.getNode(), `Payment failed, returned status ${response.status} ${response.statusText}`);
						}

						// Extract X-PAYMENT-RESPONSE header if present
						const paymentResponseHeader = response.headers.get('X-PAYMENT-RESPONSE');
						if (paymentResponseHeader) {
							try {
								const decodedPaymentResponse = Buffer.from(paymentResponseHeader, 'base64').toString('utf-8');
								paymentResponse = JSON.parse(decodedPaymentResponse);
							} catch (error) {
								const errorMessage = error instanceof Error ? error.message : 'Unknown error';
								paymentResponse = { raw: paymentResponseHeader, error: `Failed to decode payment response: ${errorMessage}` };
							}
						} else {
							throw new NodeOperationError(this.getNode(), 'No payment response header found');
						}
					}
				}

				let responseData: any = {};

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
						paymentDetails,
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
