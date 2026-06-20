import {
  NodeOperationError,
  type IDataObject,
  type IExecuteFunctions,
  type INodeExecutionData,
} from "n8n-workflow";
import { buildArgs, parseJsonParam, toStringArray } from "../../helpers/args";
import { readTimeout } from "../../helpers/common";
import { resolveBinaryOrUrl } from "../../helpers/binary";
import { vidiqToolCall, vidiqToolCallFull } from "../../transport/mcpClient";

// Render tools (compose / generate video & clips / thumbnails / voice clone) run
// asynchronously and return a job descriptor with an `mcpJobId`. n8n Cloud does not
// permit in-node blocking waits, so these operations return the job immediately;
// poll it with the Job → Get Job Status operation (optionally behind a Wait node).
export async function studioExecute(
  ctx: IExecuteFunctions,
  operation: string,
  i: number,
): Promise<IDataObject | IDataObject[] | INodeExecutionData[]> {
  if (operation === "cloneVoiceUpload") {
    const params: IDataObject = {
      name: ctx.getNodeParameter("name", i, "") as string,
      audioBase64: await resolveBinaryOrUrl(
        ctx,
        i,
        ctx.getNodeParameter("audioBase64InputType", i, "url") as
          | "url"
          | "binary",
        ctx.getNodeParameter("audioBase64", i, "") as string,
        ctx.getNodeParameter("audioBase64BinaryProperty", i, "data") as string,
        false,
      ),
      contentType: ctx.getNodeParameter("contentType", i, "") as string,
      description: ctx.getNodeParameter("description", i, "") as string,
    };
    return vidiqToolCall(
      ctx,
      "vidiq_voiceover_clone",
      buildArgs(params),
      readTimeout(ctx, i),
    );
  }

  if (operation === "cloneVoiceFromYoutube") {
    const params: IDataObject = {
      youtubeUrl: ctx.getNodeParameter("youtubeUrl", i, "") as string,
      name: ctx.getNodeParameter("name", i, "") as string,
    };
    return vidiqToolCall(
      ctx,
      "vidiq_voiceover_clone_start",
      buildArgs(params),
      readTimeout(ctx, i),
    );
  }

  if (operation === "compose") {
    const params: IDataObject = {
      scenes: parseJsonParam(ctx, "scenes", i),
      format: ctx.getNodeParameter("format", i, "vertical") as string,
      voiceover: parseJsonParam(ctx, "voiceover", i),
      music: parseJsonParam(ctx, "music", i),
      overlays: parseJsonParam(ctx, "overlays", i),
      captions: parseJsonParam(ctx, "captions", i),
    };
    return vidiqToolCall(
      ctx,
      "vidiq_compose",
      buildArgs(params),
      readTimeout(ctx, i),
    );
  }

  if (operation === "findBroll") {
    const params: IDataObject = {
      query: ctx.getNodeParameter("query", i, "") as string,
      orientation: ctx.getNodeParameter(
        "orientation",
        i,
        "landscape",
      ) as string,
      minDurationSeconds: ctx.getNodeParameter(
        "minDurationSeconds",
        i,
        0,
      ) as number,
      maxDurationSeconds: ctx.getNodeParameter(
        "maxDurationSeconds",
        i,
        0,
      ) as number,
    };
    return vidiqToolCall(
      ctx,
      "vidiq_generate_broll",
      buildArgs(params),
      readTimeout(ctx, i),
    );
  }

  if (operation === "generateClips") {
    const params: IDataObject = {
      videoUrl: ctx.getNodeParameter("videoUrl", i, "") as string,
      uploadedVideoUrl: ctx.getNodeParameter(
        "uploadedVideoUrl",
        i,
        "",
      ) as string,
      videoDuration: ctx.getNodeParameter("videoDuration", i, 0) as number,
      videoFilename: ctx.getNodeParameter("videoFilename", i, "") as string,
      prompt: ctx.getNodeParameter("prompt", i, "") as string,
      clipDuration: ctx.getNodeParameter("clipDuration", i, 0) as number,
      videoLanguage: ctx.getNodeParameter("videoLanguage", i, "") as string,
      imgUrl: ctx.getNodeParameter("imgUrl", i, "") as string,
      captionStyle: ctx.getNodeParameter(
        "captionStyle",
        i,
        "Classic Style",
      ) as string,
      processingStartSeconds: ctx.getNodeParameter(
        "processingStartSeconds",
        i,
        0,
      ) as number,
      processingEndSeconds: ctx.getNodeParameter(
        "processingEndSeconds",
        i,
        0,
      ) as number,
    };
    return vidiqToolCall(
      ctx,
      "vidiq_generate_clips",
      buildArgs(params),
      readTimeout(ctx, i),
    );
  }

  if (operation === "generateThumbnail") {
    const params: IDataObject = {
      videoId: ctx.getNodeParameter("videoId", i, "") as string,
      title: ctx.getNodeParameter("title", i, "") as string,
      description: ctx.getNodeParameter("description", i, "") as string,
      transcript: ctx.getNodeParameter("transcript", i, "") as string,
      userQuery: ctx.getNodeParameter("userQuery", i, "") as string,
      currentThumbnail: await resolveBinaryOrUrl(
        ctx,
        i,
        ctx.getNodeParameter("currentThumbnailInputType", i, "url") as
          | "url"
          | "binary",
        ctx.getNodeParameter("currentThumbnail", i, "") as string,
        ctx.getNodeParameter(
          "currentThumbnailBinaryProperty",
          i,
          "data",
        ) as string,
        false,
      ),
      subjectImage: await resolveBinaryOrUrl(
        ctx,
        i,
        ctx.getNodeParameter("subjectImageInputType", i, "url") as
          | "url"
          | "binary",
        ctx.getNodeParameter("subjectImage", i, "") as string,
        ctx.getNodeParameter("subjectImageBinaryProperty", i, "data") as string,
        false,
      ),
      referenceImages: parseJsonParam(ctx, "referenceImages", i),
      feedback: parseJsonParam(ctx, "feedback", i),
    };
    return vidiqToolCall(
      ctx,
      "vidiq_generate_thumbnail",
      buildArgs(params),
      readTimeout(ctx, i),
    );
  }

  if (operation === "generateTitles") {
    const params: IDataObject = {
      videoId: ctx.getNodeParameter("videoId", i, "") as string,
      title: ctx.getNodeParameter("title", i, "") as string,
      description: ctx.getNodeParameter("description", i, "") as string,
      numTitles: ctx.getNodeParameter("numTitles", i, 0) as number,
      type: ctx.getNodeParameter("type", i, "long") as string,
      language: ctx.getNodeParameter("language", i, "") as string,
      regionCode: ctx.getNodeParameter("regionCode", i, "") as string,
      scoreThreshold: ctx.getNodeParameter("scoreThreshold", i, 0) as number,
      previousTitles: toStringArray(
        ctx.getNodeParameter("previousTitles", i, []),
      ),
      competitorTitles: parseJsonParam(ctx, "competitorTitles", i),
      analysisSummary: ctx.getNodeParameter("analysisSummary", i, "") as string,
    };
    return vidiqToolCall(
      ctx,
      "vidiq_generate_titles",
      buildArgs(params),
      readTimeout(ctx, i),
    );
  }

  if (operation === "generateVideo") {
    const params: IDataObject = {
      prompt: ctx.getNodeParameter("prompt", i, "") as string,
      model: ctx.getNodeParameter("model", i, "sora-2") as string,
      resolution: ctx.getNodeParameter("resolution", i, "720p") as string,
      duration: ctx.getNodeParameter("duration", i, 8) as number,
      aspectRatio: ctx.getNodeParameter("aspectRatio", i, "9:16") as string,
      remixVideoId: ctx.getNodeParameter("remixVideoId", i, "") as string,
      remixProjectId: ctx.getNodeParameter("remixProjectId", i, "") as string,
      startFrameB64: await resolveBinaryOrUrl(
        ctx,
        i,
        ctx.getNodeParameter("startFrameB64InputType", i, "url") as
          | "url"
          | "binary",
        ctx.getNodeParameter("startFrameB64", i, "") as string,
        ctx.getNodeParameter(
          "startFrameB64BinaryProperty",
          i,
          "data",
        ) as string,
        false,
      ),
      endFrameB64: await resolveBinaryOrUrl(
        ctx,
        i,
        ctx.getNodeParameter("endFrameB64InputType", i, "url") as
          | "url"
          | "binary",
        ctx.getNodeParameter("endFrameB64", i, "") as string,
        ctx.getNodeParameter("endFrameB64BinaryProperty", i, "data") as string,
        false,
      ),
    };
    return vidiqToolCall(
      ctx,
      "vidiq_generate_video",
      buildArgs(params),
      readTimeout(ctx, i),
    );
  }

  if (operation === "generateVoiceover") {
    const params: IDataObject = {
      script: ctx.getNodeParameter("script", i, "") as string,
      voiceId: ctx.getNodeParameter("voiceId", i, "") as string,
      output: ctx.getNodeParameter("output", i, "url_only") as string,
    };
    const { json, media } = await vidiqToolCallFull(
      ctx,
      "vidiq_voiceover_generate",
      buildArgs(params),
      readTimeout(ctx, i),
    );
    const audio = media.find((m) => m.type === "audio");
    if (audio) {
      const buffer = Buffer.from(audio.data, "base64");
      const binary = await ctx.helpers.prepareBinaryData(
        buffer,
        "voiceover.mp3",
        audio.mimeType,
      );
      return [{ json, binary: { data: binary }, pairedItem: { item: i } }];
    }
    return json;
  }

  if (operation === "listVoices") {
    return vidiqToolCall(
      ctx,
      "vidiq_voiceover_list_voices",
      buildArgs({}),
      readTimeout(ctx, i),
    );
  }

  if (operation === "refineThumbnail") {
    const params: IDataObject = {
      sourceThumbnail: await resolveBinaryOrUrl(
        ctx,
        i,
        ctx.getNodeParameter("sourceThumbnailInputType", i, "url") as
          | "url"
          | "binary",
        ctx.getNodeParameter("sourceThumbnail", i, "") as string,
        ctx.getNodeParameter(
          "sourceThumbnailBinaryProperty",
          i,
          "data",
        ) as string,
        false,
      ),
      instructions: ctx.getNodeParameter("instructions", i, "") as string,
      originalConcept: ctx.getNodeParameter("originalConcept", i, "") as string,
      videoId: ctx.getNodeParameter("videoId", i, "") as string,
      subjectImage: await resolveBinaryOrUrl(
        ctx,
        i,
        ctx.getNodeParameter("subjectImageInputType", i, "url") as
          | "url"
          | "binary",
        ctx.getNodeParameter("subjectImage", i, "") as string,
        ctx.getNodeParameter("subjectImageBinaryProperty", i, "data") as string,
        false,
      ),
      referenceImages: parseJsonParam(ctx, "referenceImages", i),
      mask: await resolveBinaryOrUrl(
        ctx,
        i,
        ctx.getNodeParameter("maskInputType", i, "url") as "url" | "binary",
        ctx.getNodeParameter("mask", i, "") as string,
        ctx.getNodeParameter("maskBinaryProperty", i, "data") as string,
        false,
      ),
    };
    return vidiqToolCall(
      ctx,
      "vidiq_refine_thumbnail",
      buildArgs(params),
      readTimeout(ctx, i),
    );
  }

  if (operation === "scoreThumbnail") {
    const params: IDataObject = {
      videoId: ctx.getNodeParameter("videoId", i, "") as string,
      title: ctx.getNodeParameter("title", i, "") as string,
      image: await resolveBinaryOrUrl(
        ctx,
        i,
        ctx.getNodeParameter("imageInputType", i, "url") as "url" | "binary",
        ctx.getNodeParameter("image", i, "") as string,
        ctx.getNodeParameter("imageBinaryProperty", i, "data") as string,
        false,
      ),
    };
    return vidiqToolCall(
      ctx,
      "vidiq_score_thumbnail",
      buildArgs(params),
      readTimeout(ctx, i),
    );
  }

  if (operation === "scoreTitle") {
    const params: IDataObject = {
      title: ctx.getNodeParameter("title", i, "") as string,
      type: ctx.getNodeParameter("type", i, "long") as string,
      videoId: ctx.getNodeParameter("videoId", i, "") as string,
      channelId: ctx.getNodeParameter("channelId", i, "") as string,
    };
    return vidiqToolCall(
      ctx,
      "vidiq_score_title",
      buildArgs(params),
      readTimeout(ctx, i),
    );
  }

  throw new NodeOperationError(
    ctx.getNode(),
    `Unknown studio operation: ${operation}`,
  );
}
