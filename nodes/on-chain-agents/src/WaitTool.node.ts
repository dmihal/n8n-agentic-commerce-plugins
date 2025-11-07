import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

export class WaitTool implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wait Tool',
		name: 'waitTool',
		icon: 'fa:pause-circle',
		iconColor: 'crimson',
		group: ['organization'],
		version: 1,
		description: 'Wait for a specified amount of time',
		defaults: {
			name: 'Wait Tool',
		},
		usableAsTool: true,
		inputs: ['main'],
		outputs: ['main'],
		properties: [
			{
				displayName: 'Amount',
				name: 'amount',
				type: 'number',
				default: 1,
				description: 'The amount of time to wait',
				required: true,
			},
			{
				displayName: 'Unit',
				name: 'unit',
				type: 'options',
				options: [
					{
						name: 'Seconds',
						value: 'seconds',
					},
					{
						name: 'Minutes',
						value: 'minutes',
					},
					{
						name: 'Hours',
						value: 'hours',
					},
				],
				default: 'seconds',
				description: 'The unit of time',
				required: true,
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		const amount = this.getNodeParameter('amount', 0) as number;
		const unit = this.getNodeParameter('unit', 0) as string;

		// Convert to milliseconds
		let waitValue: number;
		switch (unit) {
			case 'seconds':
				waitValue = amount * 1000;
				break;
			case 'minutes':
				waitValue = amount * 60 * 1000;
				break;
			case 'hours':
				waitValue = amount * 60 * 60 * 1000;
				break;
			default:
				throw new NodeOperationError(this.getNode(), `Invalid unit: ${unit}`);
		}

		// Calculate waitTill date
		const waitTill = new Date(Date.now() + waitValue);

		if (waitValue < 65000) {
			// If wait time is shorter than 65 seconds leave execution active because
			// we just check the database every 60 seconds.
			return await new Promise((resolve) => {
				const timer = setTimeout(() => resolve([items]), waitValue);
				this.onExecutionCancellation(() => clearTimeout(timer));
			});
		}

		// If longer than 65 seconds put execution to wait
		await this.putExecutionToWait(waitTill);
		return [items];
	}

  private async putToWait(context: IExecuteFunctions, waitTill: Date) {
		await context.putExecutionToWait(waitTill);
		return [context.getInputData()];
	}
}

