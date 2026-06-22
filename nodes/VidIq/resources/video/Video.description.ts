import { type INodeProperties } from "n8n-workflow";
import { optionsField } from "../../helpers/common";

const show = (operation: string) => ({
  show: { resource: ["video"], operation: [operation] },
});

export const videoDescription: INodeProperties[] = [
  {
    displayName: "Operation",
    name: "operation",
    type: "options",
    noDataExpression: true,
    displayOptions: { show: { resource: ["video"] } },
    options: [
      {
        name: "Analyze",
        value: "analyze",
        action: "Analyze a video",
        description:
          "Watch a video and produce a scene-by-scene or custom analysis",
      },
      {
        name: "Comments",
        value: "comments",
        action: "Get video comments",
        description: "Fetch comment threads for a video or channel",
      },
      {
        name: "Get Many by IDs",
        value: "getMany",
        action: "Get many videos by ID",
        description: "Fetch metadata for a list of video IDs",
      },
      {
        name: "Search YouTube",
        value: "searchYoutube",
        action: "Search videos",
        description: "Search YouTube for videos, channels and playlists",
      },
      {
        name: "Stats History",
        value: "statsHistory",
        action: "Get video stats history",
        description: "Get time-series statistics for a video",
      },
      {
        name: "Transcript",
        value: "transcript",
        action: "Get video transcript",
        description: "Fetch the transcript for a video",
      },
    ],
    default: "analyze",
  },

  // analyze -> vidiq_video_watch
  {
    displayName: "Video ID",
    name: "video",
    required: true,
    type: "string",
    default: "",
    placeholder: "dQw4w9WgXcQ",
    description:
      "YouTube video ID (e.g. dQw4w9WgXcQ). A full watch / shorts / youtu.be URL also works — vidIQ normalizes it.",
    displayOptions: show("analyze"),
  },
  {
    displayName: "Prompt",
    name: "prompt",
    type: "string",
    default: "",
    description:
      "Optional custom analysis instruction; if omitted, a scene-by-scene markdown walkthrough is produced",
    displayOptions: show("analyze"),
  },

  // comments -> vidiq_video_comments
  {
    displayName: "Video ID",
    name: "videoId",
    type: "string",
    default: "",
    description:
      "YouTube video ID (e.g. 'dQw4w9WgXcQ'). Provide either Video ID or Channel ID.",
    displayOptions: show("comments"),
  },
  {
    displayName: "Channel ID",
    name: "channelId",
    type: "string",
    default: "",
    description:
      "YouTube channel ID, handle (e.g. '@MrBeast'), or channel URL. Provide either Video ID or Channel ID.",
    displayOptions: show("comments"),
  },
  {
    displayName: "Order",
    name: "order",
    type: "options",
    options: [
      { name: "Relevance", value: "relevance" },
      { name: "Time", value: "time" },
    ],
    default: "relevance",
    description:
      "Sort order: 'relevance' (top comments) or 'time' (newest first)",
    displayOptions: show("comments"),
  },
  {
    displayName: "Limit",
    name: "maxResult",
    type: "number",
    default: 0,
    description: "Number of comment threads to return (1-100)",
    displayOptions: show("comments"),
  },

  // getMany -> vidiq_get_videos_by_ids
  {
    displayName: "Video IDs",
    name: "videoIds",
    required: true,
    type: "string",
    default: "",
    placeholder: "dQw4w9WgXcQ, oHg5SJYRHA0",
    description: "List of YouTube video IDs to fetch (comma-separated)",
    displayOptions: show("getMany"),
  },

  // searchYoutube -> vidiq_youtube_search
  {
    displayName: "Query",
    name: "query",
    required: true,
    type: "string",
    default: "",
    description: "Free-text search query (e.g. 'minecraft redstone tutorial')",
    displayOptions: show("searchYoutube"),
  },
  {
    displayName: "Type",
    name: "type",
    type: "multiOptions",
    options: [
      { name: "Channel", value: "channel" },
      { name: "Playlist", value: "playlist" },
      { name: "Video", value: "video" },
    ],
    default: [],
    description:
      "Kinds of result to return. The video-only filters require type to be exactly ['video'].",
    displayOptions: show("searchYoutube"),
  },
  {
    displayName: "Order",
    name: "order",
    type: "options",
    options: [
      { name: "Date", value: "date" },
      { name: "Rating", value: "rating" },
      { name: "Relevance", value: "relevance" },
      { name: "Title", value: "title" },
      { name: "Video Count", value: "videoCount" },
      { name: "View Count", value: "viewCount" },
    ],
    default: "relevance",
    description:
      "Sort order. 'date' = newest, 'viewCount' = most viewed, 'videoCount' = channels with most videos.",
    displayOptions: show("searchYoutube"),
  },
  {
    displayName: "Limit",
    name: "limit",
    type: "number",
    typeOptions: { minValue: 1 },
    default: 50,
    description: "Max number of results to return",
    displayOptions: show("searchYoutube"),
  },
  {
    displayName: "Published After",
    name: "publishedAfter",
    type: "string",
    default: "",
    description:
      "Only results published after this RFC 3339 timestamp (e.g. '2026-01-01T00:00:00Z')",
    displayOptions: show("searchYoutube"),
  },
  {
    displayName: "Published Before",
    name: "publishedBefore",
    type: "string",
    default: "",
    description: "Only results published before this RFC 3339 timestamp",
    displayOptions: show("searchYoutube"),
  },
  {
    displayName: "Channel ID",
    name: "channelId",
    type: "string",
    default: "",
    description: "Restrict the search to a single channel's content",
    displayOptions: show("searchYoutube"),
  },
  {
    displayName: "Region Code",
    name: "regionCode",
    type: "string",
    default: "",
    placeholder: "US",
    description:
      "ISO 3166-1 alpha-2 region code to localize results (e.g. 'US', 'DE')",
    displayOptions: show("searchYoutube"),
  },
  {
    displayName: "Video Duration",
    name: "videoDuration",
    type: "options",
    options: [
      { name: "Long", value: "long" },
      { name: "Medium", value: "medium" },
      { name: "Short", value: "short" },
    ],
    default: "short",
    description:
      "Length: short (&lt;4min), medium (4-20min), long (&gt;20min). Video only.",
    displayOptions: show("searchYoutube"),
  },
  {
    displayName: "Video Definition",
    name: "videoDefinition",
    type: "options",
    options: [
      { name: "High", value: "high" },
      { name: "Standard", value: "standard" },
    ],
    default: "high",
    description: "Resolution: 'high' (HD) or 'standard' (SD). Video only.",
    displayOptions: show("searchYoutube"),
  },
  {
    displayName: "Event Type",
    name: "eventType",
    type: "options",
    options: [
      { name: "Completed", value: "completed" },
      { name: "Live", value: "live" },
      { name: "Upcoming", value: "upcoming" },
    ],
    default: "completed",
    description:
      "Live broadcasts: 'live', 'upcoming', or 'completed'. Video only.",
    displayOptions: show("searchYoutube"),
  },
  {
    displayName: "Topic",
    name: "topic",
    type: "string",
    default: "",
    description:
      "Restrict to a topic category (e.g. 'gaming', 'music', 'technology', 'sports', 'entertainment', 'knowledge')",
    displayOptions: show("searchYoutube"),
  },

  // statsHistory -> vidiq_video_stats
  {
    displayName: "Video ID",
    name: "videoId",
    required: true,
    type: "string",
    default: "",
    description: "YouTube video ID (e.g. 'dQw4w9WgXcQ')",
    displayOptions: show("statsHistory"),
  },
  {
    displayName: "Granularity",
    name: "granularity",
    required: true,
    type: "options",
    options: [
      { name: "Daily", value: "daily" },
      { name: "Hourly", value: "hourly" },
      { name: "Monthly", value: "monthly" },
    ],
    default: "daily",
    description: "Time granularity for stats data points",
    displayOptions: show("statsHistory"),
  },
  {
    displayName: "From",
    name: "from",
    type: "string",
    default: "",
    description: "Start of time range (ISO-8601, e.g. '2026-01-01T00:00:00Z')",
    displayOptions: show("statsHistory"),
  },
  {
    displayName: "To",
    name: "to",
    type: "string",
    default: "",
    description: "End of time range (ISO-8601)",
    displayOptions: show("statsHistory"),
  },
  {
    displayName: "Order",
    name: "order",
    type: "options",
    options: [
      { name: "Ascending", value: "asc" },
      { name: "Descending", value: "desc" },
    ],
    default: "asc",
    description: "Sort order by timestamp",
    displayOptions: show("statsHistory"),
  },

  // transcript -> vidiq_video_transcript
  {
    displayName: "Video ID",
    name: "videoId",
    required: true,
    type: "string",
    default: "",
    description: "YouTube video ID (e.g. 'dQw4w9WgXcQ')",
    displayOptions: show("transcript"),
  },
  {
    displayName: "Language",
    name: "language",
    type: "string",
    default: "",
    description: "Language code for the transcript (e.g. 'en', 'es')",
    displayOptions: show("transcript"),
  },

  optionsField("video"),
];
