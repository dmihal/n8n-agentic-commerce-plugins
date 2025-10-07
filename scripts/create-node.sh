#!/bin/bash

# Script to create a new n8n node plugin
# Usage: ./scripts/create-node.sh <node-name>

if [ $# -eq 0 ]; then
    echo "Usage: $0 <node-name>"
    echo "Example: $0 payment-processor"
    exit 1
fi

NODE_NAME=$1
NODE_DIR="nodes/${NODE_NAME}-node"
NODE_CLASS_NAME=$(echo $NODE_NAME | sed 's/-\([a-z]\)/\U\1/g' | sed 's/^\([a-z]\)/\U\1/')

echo "Creating new n8n node: $NODE_NAME"
echo "Directory: $NODE_DIR"
echo "Class name: $NODE_CLASS_NAME"

# Create directory structure
mkdir -p "$NODE_DIR/src"
mkdir -p "$NODE_DIR/icons"

# Create package.json
cat > "$NODE_DIR/package.json" << EOF
{
  "name": "n8n-nodes-${NODE_NAME}",
  "version": "1.0.0",
  "description": "${NODE_NAME} node for n8n",
  "keywords": [
    "n8n-community-node-package",
    "n8n",
    "${NODE_NAME}"
  ],
  "license": "MIT",
  "homepage": "https://github.com/your-org/n8n-agentic-commerce-plugins",
  "author": {
    "name": "Your Name",
    "email": "your.email@example.com"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/your-org/n8n-agentic-commerce-plugins.git"
  },
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc && npm run package",
    "build:watch": "tsc --watch",
    "dev": "tsc --watch",
    "package": "n8n-node-dev package",
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "test": "jest",
    "clean": "rm -rf dist"
  },
  "files": [
    "dist"
  ],
  "n8n": {
    "n8nNodesApiVersion": 1,
    "credentials": [
      "dist/credentials/${NODE_CLASS_NAME}Api.credentials.js"
    ],
    "nodes": [
      "dist/nodes/${NODE_CLASS_NAME}/${NODE_CLASS_NAME}.node.js"
    ]
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.0.0",
    "jest": "^29.0.0",
    "n8n-node-dev": "^1.0.0",
    "typescript": "^5.0.0"
  },
  "dependencies": {
    "n8n-workflow": "^1.0.0"
  },
  "peerDependencies": {
    "n8n-workflow": "*"
  }
}
EOF

# Create tsconfig.json
cat > "$NODE_DIR/tsconfig.json" << EOF
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "**/*.test.ts",
    "**/*.spec.ts"
  ]
}
EOF

# Create node file
cat > "$NODE_DIR/src/${NODE_CLASS_NAME}.node.ts" << EOF
import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

export class ${NODE_CLASS_NAME} implements INodeType {
	description: INodeTypeDescription = {
		displayName: '${NODE_CLASS_NAME}',
		name: '${NODE_NAME}',
		icon: 'file:${NODE_NAME}.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: '${NODE_CLASS_NAME} operations',
		defaults: {
			name: '${NODE_CLASS_NAME}',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: '${NODE_NAME}Api',
				required: true,
			},
		],
		requestDefaults: {
			baseURL: 'https://api.${NODE_NAME}.com',
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
						name: 'Example',
						value: 'example',
					},
				],
				default: 'example',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['example'],
					},
				},
				options: [
					{
						name: 'Get',
						value: 'get',
						action: 'Get an example',
						description: 'Get an example by ID',
						routing: {
							request: {
								method: 'GET',
								url: '/examples/{{$parameter["exampleId"]}}',
							},
						},
					},
				],
				default: 'get',
			},
			{
				displayName: 'Example ID',
				name: 'exampleId',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['example'],
						operation: ['get'],
					},
				},
				default: '',
				required: true,
				description: 'The ID of the example to retrieve',
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

				if (resource === 'example') {
					if (operation === 'get') {
						const exampleId = this.getNodeParameter('exampleId', i) as string;
						
						const responseData = await this.helpers.requestWithAuthentication.call(
							this,
							'${NODE_NAME}Api',
							{
								method: 'GET',
								url: \`/examples/\${exampleId}\`,
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
						json: { error: error.message },
					});
				} else {
					throw new NodeOperationError(this.getNode(), error);
				}
			}
		}

		return [returnData];
	}
}
EOF

# Create credentials file
cat > "$NODE_DIR/src/${NODE_CLASS_NAME}Api.credentials.ts" << EOF
import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class ${NODE_CLASS_NAME}Api implements ICredentialType {
	name = '${NODE_NAME}Api';
	displayName = '${NODE_CLASS_NAME} API';
	documentationUrl = 'https://docs.${NODE_NAME}.com/api';
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
			baseURL: 'https://api.${NODE_NAME}.com',
			url: '/auth/verify',
		},
	};
}
EOF

# Create index file
cat > "$NODE_DIR/src/index.ts" << EOF
export * from './${NODE_CLASS_NAME}.node';
export * from './${NODE_CLASS_NAME}Api.credentials';
EOF

# Create a simple SVG icon
cat > "$NODE_DIR/icons/${NODE_NAME}.svg" << EOF
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
  <circle cx="8.5" cy="8.5" r="1.5"/>
  <polyline points="21,15 16,10 5,21"/>
</svg>
EOF

echo "✅ Created new n8n node: $NODE_NAME"
echo "📁 Directory: $NODE_DIR"
echo ""
echo "Next steps:"
echo "1. cd $NODE_DIR"
echo "2. pnpm install"
echo "3. Update the node implementation in src/${NODE_CLASS_NAME}.node.ts"
echo "4. Update the credentials in src/${NODE_CLASS_NAME}Api.credentials.ts"
echo "5. Replace the icon in icons/${NODE_NAME}.svg"
echo "6. Run 'pnpm build' to build the node"
