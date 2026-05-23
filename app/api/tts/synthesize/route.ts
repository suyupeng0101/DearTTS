import { NextRequest, NextResponse } from "next/server";

const MAX_TEXT_LENGTH = 5000;
const DEFAULT_MIMO_TTS_ENDPOINT = "https://api.xiaomimimo.com/v1/chat/completions";

type VoiceMode = "preset" | "design" | "clone";

type SynthesizeBody = {
  text?: string;
  voiceMode?: VoiceMode;
  voiceId?: string;
  voicePrompt?: string;
  referenceAudioData?: string;
};

type MiMoTtsResponse = {
  choices?: Array<{
    message?: {
      audio?: {
        data?: string;
      };
    };
  }>;
  error?: {
    message?: string;
  };
};

function modelForMode(mode: VoiceMode) {
  if (mode === "design") return "mimo-v2.5-tts-voicedesign";
  if (mode === "clone") return "mimo-v2.5-tts-voiceclone";
  return "mimo-v2.5-tts";
}

function buildMessages(body: SynthesizeBody, text: string, mode: VoiceMode) {
  if (mode === "design") {
    return [
      {
        role: "user",
        content: body.voicePrompt?.trim() || "自然、清晰、适合内容旁白的声音。",
      },
      { role: "assistant", content: text },
    ];
  }

  const styleInstruction =
    body.voicePrompt?.trim() ||
    "请使用自然、清晰、适合内容旁白的语气进行语音合成。";

  return [
    { role: "user", content: mode === "clone" ? "" : styleInstruction },
    { role: "assistant", content: text },
  ];
}

function buildAudio(body: SynthesizeBody, mode: VoiceMode) {
  if (mode === "design") {
    return {
      format: "wav",
      optimize_text_preview: true,
    };
  }

  if (mode === "clone") {
    return {
      format: "wav",
      voice: body.referenceAudioData,
    };
  }

  return {
    format: "wav",
    voice: body.voiceId || "mimo_default",
  };
}

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get("x-mimo-api-key")?.trim();

  if (!apiKey) {
    return NextResponse.json({ message: "缺少 MiMo v2.5 API Key。" }, { status: 401 });
  }

  let body: SynthesizeBody;
  try {
    body = (await request.json()) as SynthesizeBody;
  } catch {
    return NextResponse.json({ message: "请求体格式无效。" }, { status: 400 });
  }

  const text = body.text?.trim() ?? "";
  if (!text) {
    return NextResponse.json({ message: "请输入需要合成的文案。" }, { status: 400 });
  }

  if (text.length > MAX_TEXT_LENGTH) {
    return NextResponse.json({ message: `单次合成最多 ${MAX_TEXT_LENGTH} 字。` }, { status: 400 });
  }

  const voiceMode = body.voiceMode ?? "preset";
  if (voiceMode === "clone" && !body.referenceAudioData) {
    return NextResponse.json({ message: "音色复刻需要上传 mp3 或 wav 参考音频。" }, { status: 400 });
  }

  const endpoint = process.env.MIMO_TTS_ENDPOINT || DEFAULT_MIMO_TTS_ENDPOINT;
  const payload = {
    model: modelForMode(voiceMode),
    messages: buildMessages(body, text, voiceMode),
    audio: buildAudio(body, voiceMode),
  };

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = (await response.json().catch(() => null)) as MiMoTtsResponse | null;

    if (!response.ok) {
      return NextResponse.json(
        { message: data?.error?.message || "MiMo v2.5 合成失败，请检查 API Key、额度或请求参数。" },
        { status: response.status },
      );
    }

    const audioBase64 = data?.choices?.[0]?.message?.audio?.data;
    if (!audioBase64) {
      return NextResponse.json({ message: "MiMo 响应中没有返回音频数据。" }, { status: 502 });
    }

    const audio = Buffer.from(audioBase64, "base64");
    return new NextResponse(audio, {
      headers: {
        "Content-Type": "audio/wav",
        "Content-Disposition": `attachment; filename="deartts.wav"`,
      },
    });
  } catch {
    return NextResponse.json({ message: "合成服务暂时不可用。" }, { status: 502 });
  }
}
