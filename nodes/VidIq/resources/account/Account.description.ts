import { type INodeProperties } from "n8n-workflow";
import { optionsField } from "../../helpers/common";

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
    ],
    default: "getBalance",
  },
  optionsField("account"),
];
