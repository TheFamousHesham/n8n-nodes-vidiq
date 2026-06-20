// n8n-nodes-vidiq — typed n8n operations over vidIQ's MCP API.
// Speaks MCP tools/call via n8n http helpers only (no fs, no fetch, no runtime deps).

import {
	NodeConnectionTypes,
	NodeOperationError,
	type IDataObject,
	type IExecuteFunctions,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
} from 'n8n-workflow';

import { keywordDescription } from './resources/keyword/Keyword.description';
import { keywordExecute } from './resources/keyword/execute';

type ResourceExecute = (
	ctx: IExecuteFunctions,
	operation: string,
	itemIndex: number,
) => Promise<IDataObject | IDataObject[]>;

const executors: Record<string, ResourceExecute> = {
	keyword: keywordExecute,
};

export class VidIq implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'VidIQ',
		name: 'vidIq',
		icon: 'file:vidiq.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'YouTube & Instagram intelligence and AI content tools via vidIQ',
		defaults: { name: 'VidIQ' },
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [{ name: 'vidIqApi', required: true }],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				// Alphabetical order required by n8n verification
				options: [
					{ name: 'Account', value: 'account' },
					{ name: 'Channel', value: 'channel' },
					{ name: 'Instagram', value: 'instagram' },
					{ name: 'Job', value: 'job' },
					{ name: 'Keyword', value: 'keyword' },
					{ name: 'Studio', value: 'studio' },
					{ name: 'Trend', value: 'trend' },
					{ name: 'Video', value: 'video' },
				],
				default: 'keyword',
			},
			...keywordDescription,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const out: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const exec = executors[resource];

		for (let i = 0; i < items.length; i++) {
			try {
				if (!exec) {
					throw new NodeOperationError(this.getNode(), `Unsupported resource: ${resource}`, {
						itemIndex: i,
					});
				}
				const operation = this.getNodeParameter('operation', i) as string;
				const result = await exec(this, operation, i);
				const rows = Array.isArray(result) ? result : [result];
				for (const json of rows) out.push({ json, pairedItem: { item: i } });
			} catch (error) {
				if (this.continueOnFail()) {
					out.push({ json: { error: (error as Error).message }, pairedItem: { item: i } });
					continue;
				}
				throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
			}
		}
		return [out];
	}
}
