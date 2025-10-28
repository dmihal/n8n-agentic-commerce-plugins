/* ------------------------------------------------------------------
   n8n Node: X402 Payment Facilitator
   ------------------------------------------------------------------ */

import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeOperationError,
} from 'n8n-workflow';
import { createFacilitatorConfig } from '@coinbase/x402';
import { PaymentRequirements, Network } from 'x402/types';
import { CHAIN_CONFIGS } from './chainConfig';

export class X402Facilitator implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'x402 Facilitator',
    name: 'x402Facilitator',
    icon: 'file:x402-icon-blue.png',
    group: ['transform'],
    version: 1,
    subtitle: '={{"x402 " + $parameter["operation"]}}',
    description: 'Interact with an X402 payment facilitator',
    defaults: {
      name: 'X402 Facilitator',
    },
    inputs: ['main'],
    outputs: ['main'],

    /* ------------------------------------------------------------------
        Credentials
        ------------------------------------------------------------------ */
    credentials: [
      {
        name: 'x402FacilitatorApi',
        required: false,
      },
    ],

    /* ------------------------------------------------------------------
        Request defaults – baseURL should be set by the credential
        ------------------------------------------------------------------ */
    requestDefaults: {
      baseURL: '={{ $credentials.url }}',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    },

    /* ------------------------------------------------------------------
        Node properties – user selects an operation
        ------------------------------------------------------------------ */
    properties: [
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        options: [
          { name: 'Verify Payment',   value: 'verify',   action: 'Verify a payment payload'  },
          { name: 'Settle Payment',   value: 'settle',   action: 'Execute a verified payment' },
          { name: 'Get Supported',   value: 'supported',action: 'List supported schemes/networks' },
        ],
        default: 'verify',
      },

      /* ------------------------------------------------------------------
          Payload / Requirements – shown only for verify/settle
          ------------------------------------------------------------------ */
      {
        displayName: 'Payment Payload (JSON)',
        name: 'paymentPayload',
        type: 'json',
        description: 'The full PaymentPayload object as defined in the spec',
        default: '{}',
        required: true,
        displayOptions: {
          show: { operation: ['verify', 'settle'] },
        },
      },
      {
        displayName: 'Network',
        name: 'network',
        type: 'options',
        options: CHAIN_CONFIGS.map(chain => ({
          name: chain.name,
          value: chain.id,
        })),
        default: 'base-sepolia',
        description: 'The blockchain network',
        required: true,
        displayOptions: {
          show: { operation: ['verify', 'settle'] },
        },
      },
      {
        displayName: 'Maximum Amount Required',
        name: 'maxAmountRequired',
        type: 'string',
        description: 'The maximum amount required for payment',
        default: '',
        required: true,
        displayOptions: {
          show: { operation: ['verify', 'settle'] },
        },
      },
      {
        displayName: 'Asset Address',
        name: 'asset',
        type: 'string',
        description: 'The ERC-20 token contract address',
        default: '',
        required: true,
        displayOptions: {
          show: { operation: ['verify', 'settle'] },
        },
      },
      {
        displayName: 'Payment Recipient Address',
        name: 'payTo',
        type: 'string',
        description: 'The address to receive payment',
        default: '',
        required: true,
        displayOptions: {
          show: { operation: ['verify', 'settle'] },
        },
      },
      {
        displayName: 'Resource URL',
        name: 'resource',
        type: 'string',
        description: 'The resource URL being paid for',
        default: '',
        required: false,
        displayOptions: {
          show: { operation: ['verify', 'settle'] },
        },
      },
      {
        displayName: 'Description',
        name: 'description',
        type: 'string',
        description: 'Description of what the payment is for',
        default: '',
        required: false,
        displayOptions: {
          show: { operation: ['verify', 'settle'] },
        },
      },

      /* ------------------------------------------------------------------
          For supported – no extra fields needed
          ------------------------------------------------------------------ */
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      try {
        const operation  = this.getNodeParameter('operation', i) as string;
        // const credentials = await this.getCredentials('x402FacilitatorApi');

        // const baseURL = credentials.facilitatorType === 'coinbase'
        //   ? 'https://x402.org/facilitator'
        //   : credentials.baseURL as string;

        const config = createFacilitatorConfig(process.env.CDP_API_ID, process.env.CDP_SECRET);
        const headers = await config.createAuthHeaders!();

        let response: any;

        if (operation === 'verify') {
          /* --------------------------------------------------------------
              Build the request body for /verify
              -------------------------------------------------------------- */
          const paymentPayload = this.getNodeParameter('paymentPayload', i) as object;
          const network = this.getNodeParameter('network', i) as string;
          const maxAmountRequired = this.getNodeParameter('maxAmountRequired', i) as string;
          const asset = this.getNodeParameter('asset', i) as string;
          const payTo = this.getNodeParameter('payTo', i) as string;
          const resource = this.getNodeParameter('resource', i) as string | undefined;
          const description = this.getNodeParameter('description', i) as string | undefined;

          const paymentRequirements: any = {
            network,
            maxAmountRequired,
            asset,
            payTo,
          };
          if (resource) paymentRequirements.resource = resource;
          if (description) paymentRequirements.description = description;

          response = await this.helpers.httpRequest.call(
            this,
            {
              method: 'POST',
              url: '/verify',
              baseURL: config.url,
              body: {
                x402Version: 1,
                paymentPayload,
                paymentRequirements,
              },
              headers: headers.verify,
              json: true,
            }
          );
        } else if (operation === 'settle') {
          /* --------------------------------------------------------------
              Build the request body for /settle
              -------------------------------------------------------------- */
          const paymentPayload = this.getNodeParameter('paymentPayload', i) as any;
          const network = this.getNodeParameter('network', i) as string;
          const maxAmountRequired = this.getNodeParameter('maxAmountRequired', i) as string;
          const asset = this.getNodeParameter('asset', i) as string;
          const payTo = this.getNodeParameter('payTo', i) as string;
          const resource = this.getNodeParameter('resource', i) as string;
          const description = this.getNodeParameter('description', i) as string;

          const paymentRequirements: PaymentRequirements = {
            scheme: 'exact',
            network: network as Network,
            maxAmountRequired: maxAmountRequired as string,
            asset: asset as string,
            payTo: payTo as string,
            resource: resource as string,
            description: description as string,
            mimeType: 'application/json',
            maxTimeoutSeconds: 60,
            extra: {
              name: 'USDC',
              version: '2'
            }
          };

          response = await this.helpers.httpRequest.call(
            this,
            {
              method: 'POST',
              url: '/settle',
              baseURL: config.url,
              body: {
                x402Version: 1,
                paymentPayload,
                paymentRequirements,
              },
              headers: headers.settle,
              json: true,
            }
          );
        } else if (operation === 'supported') {
          /* --------------------------------------------------------------
              Call /supported – no body needed
              -------------------------------------------------------------- */
          response = await this.helpers.httpRequest.call(
            this,
            {
              method: 'GET',
              url: '/supported',
              baseURL: config.url,
              headers: headers.supported,
              json: true,
            }
          );
        } else {
          throw new NodeOperationError(this.getNode(), `Unsupported operation combination`);
        }

        returnData.push({ json: response });
      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({
            json: { error: error instanceof Error ? error.message : String(error) },
          });
        } else {
          console.warn(error);
          throw new NodeOperationError(this.getNode(), error instanceof Error ? error : new Error(String(error)));
        }
      }
    }

    return [returnData];
  }
}
