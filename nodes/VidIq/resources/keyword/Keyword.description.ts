import { type INodeProperties } from 'n8n-workflow';

const show = (operation: string) => ({ show: { resource: ['keyword'], operation: [operation] } });

export const keywordDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['keyword'] } },
		options: [
			{
				name: 'Research',
				value: 'research',
				action: 'Research keywords',
				description: 'Find search volume, competition and related keyword opportunities',
			},
		],
		default: 'research',
	},
	{
		displayName: 'Keyword',
		name: 'keyword',
		type: 'string',
		default: '',
		description: 'Seed keyword to research',
		displayOptions: show('research'),
	},
	{
		displayName: 'Mode',
		name: 'mode',
		type: 'options',
		options: [
			{ name: 'Country Search', value: 'country_search' },
			{ name: 'Country Top', value: 'country_top' },
			{ name: 'Research', value: 'research' },
		],
		default: 'research',
		description: 'Which keyword-research mode to use',
		displayOptions: show('research'),
	},
	{
		displayName: 'Country',
		name: 'country',
		type: 'string',
		default: '',
		placeholder: 'US',
		description: 'ISO 3166-1 alpha-2 country code for in-country volume',
		displayOptions: show('research'),
	},
	{
		displayName: 'Include Related',
		name: 'includeRelated',
		type: 'boolean',
		default: true,
		description: 'Whether to include related keyword suggestions',
		displayOptions: show('research'),
	},
	{
		displayName: 'Broad',
		name: 'broad',
		type: 'boolean',
		default: false,
		description: 'Whether to broaden the keyword search',
		displayOptions: show('research'),
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: { minValue: 1 },
		default: 50,
		description: 'Max number of results to return',
		displayOptions: show('research'),
	},
	{
		displayName: 'Extra Arguments (JSON)',
		name: 'extraArguments',
		type: 'json',
		default: '{}',
		description:
			'Advanced: raw vidIQ arguments merged as a base; typed fields above take precedence',
		displayOptions: { show: { resource: ['keyword'] } },
	},
];
