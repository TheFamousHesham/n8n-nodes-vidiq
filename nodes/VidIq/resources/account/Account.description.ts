import { type INodeProperties } from "n8n-workflow";

const show = (operation: string) => ({
  show: { resource: ["account"], operation: [operation] },
});

export const accountDescription: INodeProperties[] = [
  {
    displayName: "Operation",
    name: "operation",
    type: "options",
    noDataExpression: true,
    displayOptions: { show: { resource: ["account"] } },
    options: [
      {
        name: "Get Credit Balance",
        value: "getBalance",
        action: "Get credit balance",
        description: "Check the user's current vidIQ credits balance",
      },
      {
        name: "Submit Feedback",
        value: "submitFeedback",
        action: "Submit feedback",
        description: "Submit feedback about the vidIQ MCP",
      },
    ],
    default: "getBalance",
  },
  {
    displayName: "Type",
    name: "type",
    required: true,
    type: "options",
    options: [
      { name: "Bug Report", value: "bug_report" },
      { name: "Feature Request", value: "feature_request" },
      { name: "General", value: "general" },
      { name: "Improvement", value: "improvement" },
    ],
    default: "feature_request",
    description: "The kind of feedback being submitted",
    displayOptions: show("submitFeedback"),
  },
  {
    displayName: "Tool Name",
    name: "toolName",
    type: "string",
    default: "",
    description:
      "The relevant existing tool name, if this feedback is about a specific tool",
    displayOptions: show("submitFeedback"),
  },
  {
    displayName: "Description",
    name: "description",
    required: true,
    type: "string",
    default: "",
    description: "What you're requesting, reporting, or suggesting — and why",
    displayOptions: show("submitFeedback"),
  },
  {
    displayName: "Use Case",
    name: "useCase",
    type: "string",
    default: "",
    description: "A specific workflow or scenario for additional context",
    displayOptions: show("submitFeedback"),
  },
  {
    displayName: "Extra Arguments (JSON)",
    name: "extraArguments",
    type: "json",
    default: "{}",
    description:
      "Advanced: raw vidIQ arguments merged as a base; typed fields above take precedence",
    displayOptions: { show: { resource: ["account"] } },
  },
];
