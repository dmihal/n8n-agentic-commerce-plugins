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
        displayName: 'Payment Requirements (JSON)',
        name: 'paymentRequirements',
        type: 'json',
        description: 'The PaymentRequirements object that the facilitator will validate against',
        default: '{}',
        required: true,
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
          const paymentPayload     = this.getNodeParameter('paymentPayload', i) as object;
          const paymentRequirements = JSON.parse(this.getNodeParameter('paymentRequirements', i) as string);

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
          const paymentPayload     = this.getNodeParameter('paymentPayload', i) as any;
          const paymentRequirements = JSON.parse(this.getNodeParameter('paymentRequirements', i) as string);

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
