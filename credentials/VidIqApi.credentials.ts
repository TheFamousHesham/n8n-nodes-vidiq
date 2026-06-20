import {
  type IAuthenticateGeneric,
  type ICredentialTestRequest,
  type ICredentialType,
  type INodeProperties,
  type Icon,
} from "n8n-workflow";

export class VidIqApi implements ICredentialType {
  name = "vidIqApi";

  displayName = "VidIQ API";

  documentationUrl =
    "https://github.com/TheFamousHesham/n8n-nodes-vidiq#credentials";

  icon: Icon = "file:vidiq.svg";

  properties: INodeProperties[] = [
    {
      displayName: "API Key",
      name: "apiKey",
      type: "string",
      typeOptions: { password: true },
      default: "",
      required: true,
      placeholder: "vidiq_...",
      description:
        "Your vidIQ API key. Requires a vidIQ Max plan. Generate it at vidiq.com (MCP / API access).",
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: "generic",
    properties: {
      headers: {
        Authorization: "=Bearer {{$credentials.apiKey}}",
        Accept: "application/json, text/event-stream",
      },
    },
  };

  // Bad key -> HTTP 401 -> n8n marks the credential invalid.
  test: ICredentialTestRequest = {
    request: {
      baseURL: "https://mcp.vidiq.com",
      url: "/mcp",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
      },
      body: {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: { name: "vidiq_balance", arguments: {} },
      },
    },
  };
}
