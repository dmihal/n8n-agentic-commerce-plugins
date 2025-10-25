/* ------------------------------------------------------------------
   Credential: X402 Facilitator API
   ------------------------------------------------------------------ */

import {
  ICredentialType,
  INodeProperties,
  IAuthenticateGeneric,
  ICredentialTestRequest,
} from 'n8n-workflow';

export class X402FacilitatorApi implements ICredentialType {
  name = 'x402FacilitatorApi';
  displayName = 'x402 Payment Facilitator';
  documentationUrl = 'https://x402.gitbook.io/x402/core-concepts/facilitator';

  properties: INodeProperties[] = [
    {
      displayName: 'Facilitator',
      name: 'facilitatorType',
      type: 'options',
      options: [
        {
          name: 'Coinbase',
          value: 'coinbase',
        },
        {
          name: 'Custom',
          value: 'custom',
        },
      ],
      default: 'coinbase',
      required: true,
      description: 'Select a preset facilitator or choose custom to enter your own URL',
    },
    {
      displayName: 'Base URL',
      name: 'baseURL',
      type: 'string',
      default: '',
      required: true,
      displayOptions: {
        show: {
          facilitatorType: ['custom'],
        },
      },
      description:
        'The root endpoint of the facilitator (e.g., https://api.facilitator.com)',
    },
    {
      displayName: 'API Key / Token',
      name: 'apiKey',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      required: false,
      description:
        'Your facilitator API key or bearer token used for authentication',
    },
    {
      type: 'notice',
      name: 'notice',
      displayOptions: {
        show: {
          facilitatorType: ['coinbase'],
        },
      },
      displayName: '<a href="https://cdp.coinbase.com/" target="_blank">CDP API key</a> is required for mainnet transactions.',
      default: '',
    },
  ];

  /**
   * Generic authentication – we just add an Authorization header.
   * Feel free to change the scheme (e.g., Basic, Bearer) if your
   * facilitator expects something different.
   */
  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: {
        Authorization: '=Bearer {{$credentials.apiKey}}',
      },
    },
  };

  /**
   * Optional test request – used by n8n when the user clicks
   * "Test" in the credential UI.  Adjust the path to something
   * that exists on your facilitator.
   */
  test: ICredentialTestRequest = {
    request: {
      baseURL: '={{ $credentials.facilitatorType === "coinbase" ? "https://x402.org/facilitator" : $credentials.baseURL }}',
      url: '/supported', // or any lightweight endpoint
    },
  };
}
