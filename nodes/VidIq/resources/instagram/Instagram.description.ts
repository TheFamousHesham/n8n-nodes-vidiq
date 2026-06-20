import { type INodeProperties } from "n8n-workflow";
import { optionsField } from "../../helpers/common";

const show = (operation: string) => ({
  show: { resource: ["instagram"], operation: [operation] },
});

export const instagramDescription: INodeProperties[] = [
  {
    displayName: "Operation",
    name: "operation",
    type: "options",
    noDataExpression: true,
    displayOptions: { show: { resource: ["instagram"] } },
    options: [
      {
        name: "Accounts From Outliers",
        value: "accountsFromOutliers",
        action: "Find accounts from outlier reels",
        description:
          "Discover Instagram accounts behind outlier reels for a niche",
      },
      {
        name: "Analyze Reel",
        value: "analyzeReel",
        action: "Analyze a reel",
        description: "Watch and critique an Instagram reel",
      },
      {
        name: "Find Outlier Reels",
        value: "findOutlierReels",
        action: "Find outlier reels",
        description: "Search for outlier-performing Instagram reels",
      },
      {
        name: "Get Profile",
        value: "getProfile",
        action: "Get a profile",
        description: "Fetch an Instagram profile by handle",
      },
      {
        name: "Get Profile Reels",
        value: "getProfileReels",
        action: "Get profile reels",
        description: "Fetch the reels for an Instagram profile",
      },
    ],
    default: "accountsFromOutliers",
  },

  // accountsFromOutliers
  {
    displayName: "Niche",
    name: "niche",
    required: true,
    type: "string",
    default: "",
    description:
      "One-line description of the Instagram reel/content niche to search for",
    displayOptions: show("accountsFromOutliers"),
  },
  {
    displayName: "Audience Query",
    name: "audienceQuery",
    required: true,
    type: "string",
    default: "",
    description:
      "Format: Culture/Region: ...; Global: &lt;true|false&gt;; Demographics: ...;",
    displayOptions: show("accountsFromOutliers"),
  },
  {
    displayName: "Followers Min",
    name: "followersMin",
    type: "number",
    default: 0,
    description: "Minimum follower count to include",
    displayOptions: show("accountsFromOutliers"),
  },
  {
    displayName: "Followers Max",
    name: "followersMax",
    type: "number",
    default: 0,
    description: "Maximum follower count to include",
    displayOptions: show("accountsFromOutliers"),
  },

  // analyzeReel
  {
    displayName: "Reel",
    name: "reel",
    required: true,
    type: "string",
    default: "",
    placeholder: "C9zX1aBcD2E",
    description:
      "Instagram reel shortcode (e.g. C9zX1aBcD2E) or full reel/post URL — vidIQ normalizes it",
    displayOptions: show("analyzeReel"),
  },
  {
    displayName: "Prompt",
    name: "prompt",
    type: "string",
    default: "",
    description:
      "Optional custom instruction; prefer omitting to use the tuned default critique prompt",
    displayOptions: show("analyzeReel"),
  },

  // findOutlierReels
  {
    displayName: "Query",
    name: "query",
    required: true,
    type: "string",
    default: "",
    description: "Search query describing the reels to find",
    displayOptions: show("findOutlierReels"),
  },
  {
    displayName: "Audience Query",
    name: "audienceQuery",
    required: true,
    type: "string",
    default: "",
    description:
      "Format: Culture/Region: ...; Global: &lt;true|false&gt;; Demographics: ...;",
    displayOptions: show("findOutlierReels"),
  },
  {
    displayName: "Embedding Type",
    name: "embeddingType",
    type: "options",
    options: [
      { name: "Audience", value: "audience" },
      { name: "Concept", value: "concept" },
      { name: "Description", value: "description" },
      { name: "Format", value: "format" },
      { name: "Hook", value: "hook" },
      { name: "Overall", value: "overall" },
    ],
    default: "concept",
    description: "Which embedding dimension to match the query against",
    displayOptions: show("findOutlierReels"),
  },
  {
    displayName: "Page Size",
    name: "pageSize",
    type: "number",
    default: 0,
    description: "Number of reels to return per page",
    displayOptions: show("findOutlierReels"),
  },
  {
    displayName: "Page",
    name: "page",
    type: "number",
    default: 0,
    description: "Page number of results to return",
    displayOptions: show("findOutlierReels"),
  },
  {
    displayName: "Additional Filters",
    name: "additionalFilters",
    type: "collection",
    placeholder: "Add Filter",
    default: {},
    description: "Optional filters to narrow the outlier reel search",
    displayOptions: show("findOutlierReels"),
    options: [
      {
        displayName: "Collapse By User Posted",
        name: "collapseByUserPosted",
        type: "boolean",
        default: false,
        description: "Whether to collapse results to one reel per posting user",
      },
      {
        displayName: "Date Posted After",
        name: "datePostedAfter",
        type: "string",
        default: "",
        description:
          "Only include reels posted after this date-time (ISO 8601)",
      },
      {
        displayName: "Date Posted Before",
        name: "datePostedBefore",
        type: "string",
        default: "",
        description:
          "Only include reels posted before this date-time (ISO 8601)",
      },
      {
        displayName: "Description Language",
        name: "descriptionLanguage",
        type: "string",
        default: "",
        placeholder: "en, es",
        description:
          "Restrict to these description languages (comma-separated)",
      },
      {
        displayName: "Exclude Shortcodes",
        name: "excludeShortcodes",
        type: "string",
        default: "",
        placeholder: "C9zX1aBcD2E, D8yW2bCdE3F",
        description:
          "Reel shortcodes to exclude from results (comma-separated)",
      },
      {
        displayName: "Exclude User Posted",
        name: "excludeUserPosted",
        type: "string",
        default: "",
        placeholder: "nasa, spacex",
        description:
          "Users whose reels to exclude from results (comma-separated)",
      },
      {
        displayName: "Followers Max",
        name: "followersMax",
        type: "number",
        default: 0,
        description: "Maximum follower count to include",
      },
      {
        displayName: "Followers Min",
        name: "followersMin",
        type: "number",
        default: 0,
        description: "Minimum follower count to include",
      },
      {
        displayName: "Hashtags",
        name: "hashtags",
        type: "string",
        default: "",
        placeholder: "#space, #nasa",
        description: "Restrict to reels with these hashtags (comma-separated)",
      },
      {
        displayName: "Reel Length Max",
        name: "reelLengthMax",
        type: "number",
        default: 0,
        description: "Maximum reel length in seconds to include",
      },
      {
        displayName: "Reel Length Min",
        name: "reelLengthMin",
        type: "number",
        default: 0,
        description: "Minimum reel length in seconds to include",
      },
      {
        displayName: "Reel Median Score Max",
        name: "reelMedianScoreMax",
        type: "number",
        default: 0,
        description: "Maximum reel median score to include",
      },
      {
        displayName: "Reel Median Score Min",
        name: "reelMedianScoreMin",
        type: "number",
        default: 0,
        description: "Minimum reel median score to include",
      },
      {
        displayName: "Views Max",
        name: "viewsMax",
        type: "number",
        default: 0,
        description: "Maximum view count to include",
      },
      {
        displayName: "Views Min",
        name: "viewsMin",
        type: "number",
        default: 0,
        description: "Minimum view count to include",
      },
    ],
  },

  // getProfile
  {
    displayName: "Handle",
    name: "handle",
    required: true,
    type: "string",
    default: "",
    description: "Instagram handle (with or without leading @); 1-30 chars",
    displayOptions: show("getProfile"),
  },

  // getProfileReels
  {
    displayName: "Handle",
    name: "handle",
    required: true,
    type: "string",
    default: "",
    description: "Instagram handle (with or without leading @); 1-30 chars",
    displayOptions: show("getProfileReels"),
  },

  optionsField("instagram"),
];
