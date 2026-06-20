import { type INodeProperties } from "n8n-workflow";

const show = (operation: string) => ({
  show: { resource: ["job"], operation: [operation] },
});

export const jobDescription: INodeProperties[] = [
  {
    displayName: "Operation",
    name: "operation",
    type: "options",
    noDataExpression: true,
    displayOptions: { show: { resource: ["job"] } },
    options: [
      {
        name: "Get Job Status",
        value: "getStatus",
        action: "Get job status",
        description:
          "Check the status of an asynchronous job and retrieve its result",
      },
      {
        name: "List Jobs",
        value: "listJobs",
        action: "List jobs",
        description: "List your asynchronous vidIQ jobs, newest first",
      },
    ],
    default: "getStatus",
  },
  {
    displayName: "MCP Job ID",
    name: "mcpJobId",
    required: true,
    type: "string",
    default: "",
    description: "The job ID returned by a *_start tool",
    displayOptions: show("getStatus"),
  },
  {
    displayName: "Tool Name",
    name: "toolName",
    type: "string",
    default: "",
    description: "Filter to jobs created by this tool",
    displayOptions: show("listJobs"),
  },
  {
    displayName: "Status",
    name: "status",
    type: "options",
    options: [
      { name: "Completed", value: "completed" },
      { name: "Expired", value: "expired" },
      { name: "Failed", value: "failed" },
      { name: "Inprogress", value: "inprogress" },
      { name: "Refunded", value: "refunded" },
    ],
    default: "inprogress",
    description: "Filter by status",
    displayOptions: show("listJobs"),
  },
  {
    displayName: "Limit",
    name: "limit",
    type: "number",
    typeOptions: { minValue: 1 },
    default: 50,
    description: "Max number of results to return",
    displayOptions: show("listJobs"),
  },
  {
    displayName: "Extra Arguments (JSON)",
    name: "extraArguments",
    type: "json",
    default: "{}",
    description:
      "Advanced: raw vidIQ arguments merged as a base; typed fields above take precedence",
    displayOptions: { show: { resource: ["job"] } },
  },
];
