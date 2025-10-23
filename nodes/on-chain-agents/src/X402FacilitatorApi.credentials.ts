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
  displayName = 'X402 Payment Facilitator API';
  documentationUrl = 'https://docs.yourfacilitator.com/api'; // <-- change to your docs

  properties: INodeProperties[] = [
    {
      displayName: 'Base URL',
      name: 'baseURL',
      type: 'string',
      default: '',
      required: true,
      description:
        'The root endpoint of the facilitator (e.g., https://api.facilitator.com)',
    },
    {
      displayName: 'API Key / Token',
      name: 'apiKey',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      required: true,
      description:
        'Your facilitator API key or bearer token used for authentication',
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
   * “Test” in the credential UI.  Adjust the path to something
   * that exists on your facilitator.
   */
  test: ICredentialTestRequest = {
    request: {
      baseURL: '={{ $credentials.baseURL }}',
      url: '/supported', // or any lightweight endpoint
    },
  };
}
