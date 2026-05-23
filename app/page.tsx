"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  Download,
  Eye,
  EyeOff,
  FolderPlus,
  MicVocal,
  Plus,
  RotateCcw,
  Save,
  Settings2,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  Volume2,
} from "lucide-react";
import { presetVoices, type PresetVoice } from "@/lib/voices";
import { deleteCloneVoiceAudio, getCloneVoiceAudio, saveCloneVoiceAudio } from "@/lib/clone-voice-db";

type VoiceMode = "preset" | "design" | "clone";
type CustomVoice = {
  id: string;
  name: string;
  prompt: string;
  updatedAt: string;
};
type CloneVoice = {
  id: string;
  name: string;
  memo: string;
  audioLabel: string;
  updatedAt: string;
};

const maxChars = 5000;

function formatFileName() {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `deartts_${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.wav`;
}

function fileToDataUri(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("参考音频读取失败。"));
    reader.readAsDataURL(file);
  });
}

function readLocalStorageList<T>(key: string) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [] as T[];
    const parsed = JSON.parse(raw) as T[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    window.localStorage.removeItem(key);
    return [] as T[];
  }
}

export default function Home() {
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyStatus, setApiKeyStatus] = useState<"idle" | "checking" | "ok" | "error">("idle");
  const [apiKeyMessage, setApiKeyMessage] = useState("API Key 仅保存在本地浏览器。");
  const [voiceMode, setVoiceMode] = useState<VoiceMode>("preset");
  const [selectedVoice, setSelectedVoice] = useState<PresetVoice>(presetVoices[0]);
  const [customVoiceName, setCustomVoiceName] = useState("我的定制音色");
  const [voicePrompt, setVoicePrompt] = useState("一位温柔、清晰、语速适中的中文女声，适合讲述类内容。");
  const [customVoices, setCustomVoices] = useState<CustomVoice[]>([]);
  const [selectedCustomVoiceId, setSelectedCustomVoiceId] = useState("");
  const [cloneVoiceName, setCloneVoiceName] = useState("我的复刻音色");
  const [cloneVoiceMemo, setCloneVoiceMemo] = useState("适合播客和叙事内容。");
  const [cloneVoices, setCloneVoices] = useState<CloneVoice[]>([]);
  const [selectedCloneVoiceId, setSelectedCloneVoiceId] = useState("");
  const [pendingCloneFile, setPendingCloneFile] = useState<File | null>(null);
  const [pendingCloneLabel, setPendingCloneLabel] = useState("");
  const [text, setText] = useState("");
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [referenceLabel, setReferenceLabel] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusText, setStatusText] = useState("等待生成");
  const [errorText, setErrorText] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [downloadName, setDownloadName] = useState("deartts.wav");
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const storedKey = window.localStorage.getItem("deartts_api_key");
    const storedMode = window.localStorage.getItem("deartts_voice_mode") as VoiceMode | null;
    const storedVoiceId = window.localStorage.getItem("deartts_voice_id");
    const storedCustomVoiceName = window.localStorage.getItem("deartts_custom_voice_name");
    const storedCustomVoiceId = window.localStorage.getItem("deartts_custom_voice_id");
    const storedCustomVoices = readLocalStorageList<CustomVoice>("deartts_custom_voices");
    const storedPrompt = window.localStorage.getItem("deartts_voice_prompt");
    const storedText = window.localStorage.getItem("deartts_text");
    const storedCloneName = window.localStorage.getItem("deartts_clone_voice_name");
    const storedCloneMemo = window.localStorage.getItem("deartts_clone_voice_memo");
    const storedCloneId = window.localStorage.getItem("deartts_clone_voice_id");
    const storedCloneVoices = readLocalStorageList<CloneVoice>("deartts_clone_voices");

    if (storedKey) setApiKey(storedKey);
    if (storedMode) setVoiceMode(storedMode);
    if (storedVoiceId) {
      const voice = presetVoices.find((item) => item.id === storedVoiceId);
      if (voice) setSelectedVoice(voice);
    }
    if (storedCustomVoiceName) setCustomVoiceName(storedCustomVoiceName);
    if (storedCustomVoiceId) setSelectedCustomVoiceId(storedCustomVoiceId);
    if (storedCustomVoices.length) setCustomVoices(storedCustomVoices);
    if (storedPrompt) setVoicePrompt(storedPrompt);
    if (storedText) setText(storedText);
    if (storedCloneName) setCloneVoiceName(storedCloneName);
    if (storedCloneMemo) setCloneVoiceMemo(storedCloneMemo);
    if (storedCloneId) setSelectedCloneVoiceId(storedCloneId);
    if (storedCloneVoices.length) setCloneVoices(storedCloneVoices);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("deartts_api_key", apiKey);
  }, [apiKey]);

  useEffect(() => {
    window.localStorage.setItem("deartts_voice_mode", voiceMode);
  }, [voiceMode]);

  useEffect(() => {
    window.localStorage.setItem("deartts_voice_id", selectedVoice.id);
  }, [selectedVoice]);

  useEffect(() => {
    window.localStorage.setItem("deartts_voice_prompt", voicePrompt);
  }, [voicePrompt]);

  useEffect(() => {
    window.localStorage.setItem("deartts_custom_voice_name", customVoiceName);
  }, [customVoiceName]);

  useEffect(() => {
    window.localStorage.setItem("deartts_custom_voice_id", selectedCustomVoiceId);
  }, [selectedCustomVoiceId]);

  useEffect(() => {
    window.localStorage.setItem("deartts_custom_voices", JSON.stringify(customVoices));
  }, [customVoices]);

  useEffect(() => {
    window.localStorage.setItem("deartts_clone_voice_name", cloneVoiceName);
  }, [cloneVoiceName]);

  useEffect(() => {
    window.localStorage.setItem("deartts_clone_voice_memo", cloneVoiceMemo);
  }, [cloneVoiceMemo]);

  useEffect(() => {
    window.localStorage.setItem("deartts_clone_voice_id", selectedCloneVoiceId);
  }, [selectedCloneVoiceId]);

  useEffect(() => {
    window.localStorage.setItem("deartts_clone_voices", JSON.stringify(cloneVoices));
  }, [cloneVoices]);

  useEffect(() => {
    window.localStorage.setItem("deartts_text", text);
  }, [text]);

  const charCount = text.length;
  const canGenerate = apiKey.trim() && text.trim() && charCount <= maxChars && !isGenerating;
  const remaining = useMemo(() => maxChars - charCount, [charCount]);
  const selectedCloneVoice = cloneVoices.find((voice) => voice.id === selectedCloneVoiceId) ?? null;

  async function verifyApiKey() {
    if (!apiKey.trim()) {
      setApiKeyStatus("error");
      setApiKeyMessage("请输入 API Key。");
      return;
    }

    setApiKeyStatus("checking");
    setApiKeyMessage("正在验证...");

    const response = await fetch("/api/tts/verify-key", {
      method: "POST",
      headers: { "x-mimo-api-key": apiKey.trim() },
    });

    const data = (await response.json().catch(() => ({}))) as { ok?: boolean; message?: string };
    if (response.ok && data.ok) {
      setApiKeyStatus("ok");
      setApiKeyMessage(data.message ?? "API Key 可用。");
      return;
    }

    setApiKeyStatus("error");
    setApiKeyMessage(data.message ?? "API Key 校验失败。");
  }

  async function onReferenceUpload(file: File | null) {
    setReferenceFile(file);
    setReferenceLabel(file ? `${file.name} · ${Math.round(file.size / 1024)} KB` : "");
  }

  async function onCloneUpload(file: File | null) {
    setPendingCloneFile(file);
    setPendingCloneLabel(file ? `${file.name} · ${Math.round(file.size / 1024)} KB` : "");
  }

  function saveCustomVoice() {
    const name = customVoiceName.trim();
    const prompt = voicePrompt.trim();

    if (!name || !prompt) {
      setErrorText("请填写定制声音名称和声音描述。");
      return;
    }

    setErrorText("");
    const now = new Date().toISOString();

    if (selectedCustomVoiceId) {
      setCustomVoices((voices) =>
        voices.map((voice) => (voice.id === selectedCustomVoiceId ? { ...voice, name, prompt, updatedAt: now } : voice)),
      );
      return;
    }

    const id = globalThis.crypto?.randomUUID?.() ?? `voice_${Date.now()}`;
    const voice = { id, name, prompt, updatedAt: now };
    setCustomVoices((voices) => [voice, ...voices]);
    setSelectedCustomVoiceId(id);
  }

  function selectCustomVoice(voice: CustomVoice) {
    setSelectedCustomVoiceId(voice.id);
    setCustomVoiceName(voice.name);
    setVoicePrompt(voice.prompt);
    setVoiceMode("design");
  }

  function newCustomVoice() {
    setSelectedCustomVoiceId("");
    setCustomVoiceName("我的定制音色");
    setVoicePrompt("一位温柔、清晰、语速适中的中文女声，适合讲述类内容。");
    setVoiceMode("design");
  }

  function deleteCustomVoice(id: string) {
    setCustomVoices((voices) => voices.filter((voice) => voice.id !== id));
    if (selectedCustomVoiceId === id) newCustomVoice();
  }

  async function saveCloneVoice() {
    const name = cloneVoiceName.trim();
    const memo = cloneVoiceMemo.trim();

    if (!name) {
      setErrorText("请填写复刻声音名称。");
      return;
    }

    if (!selectedCloneVoiceId && !pendingCloneFile) {
      setErrorText("请先上传一段参考音频。");
      return;
    }

    setErrorText("");
    const id = selectedCloneVoiceId || globalThis.crypto?.randomUUID?.() || `clone_${Date.now()}`;
    const now = new Date().toISOString();
    const file = pendingCloneFile;
    const audioLabel = file ? `${file.name} · ${Math.round(file.size / 1024)} KB` : selectedCloneVoice?.audioLabel ?? "";

    if (file) {
      await saveCloneVoiceAudio({ id, dataUri: await fileToDataUri(file) });
    }

    setCloneVoices((voices) => {
      const next = { id, name, memo, audioLabel, updatedAt: now };
      const filtered = voices.filter((voice) => voice.id !== id);
      return [next, ...filtered];
    });
    setSelectedCloneVoiceId(id);
    setPendingCloneFile(null);
    setPendingCloneLabel("");
  }

  async function selectCloneVoice(voice: CloneVoice) {
    setSelectedCloneVoiceId(voice.id);
    setCloneVoiceName(voice.name);
    setCloneVoiceMemo(voice.memo);
    setPendingCloneFile(null);
    setPendingCloneLabel(voice.audioLabel);
    setVoiceMode("clone");
  }

  async function newCloneVoice() {
    setSelectedCloneVoiceId("");
    setCloneVoiceName("我的复刻音色");
    setCloneVoiceMemo("适合播客和叙事内容。");
    setPendingCloneFile(null);
    setPendingCloneLabel("");
    setVoiceMode("clone");
  }

  async function deleteCloneVoice(id: string) {
    await deleteCloneVoiceAudio(id);
    setCloneVoices((voices) => voices.filter((voice) => voice.id !== id));
    if (selectedCloneVoiceId === id) {
      await newCloneVoice();
    }
  }

  async function synthesize() {
    setErrorText("");
    setIsGenerating(true);
    setProgress(8);
    setStatusText("正在发送合成请求...");

    const timer = window.setInterval(() => {
      setProgress((value) => Math.min(92, value + (value < 30 ? 7 : value < 70 ? 4 : 2)));
    }, 180);

    try {
      let referenceAudioData: string | undefined;
      let selectedCloneIdForRequest = selectedCloneVoiceId;

      if (voiceMode === "clone") {
        if (selectedCloneVoiceId) {
          const storedAudio = await getCloneVoiceAudio(selectedCloneVoiceId);
          if (!storedAudio) {
            throw new Error("当前选择的复刻音色没有找到本地参考音频，请重新保存。");
          }
          referenceAudioData = storedAudio;
        } else if (pendingCloneFile) {
          referenceAudioData = await fileToDataUri(pendingCloneFile);
        }

        if (!referenceAudioData) {
          throw new Error("请先选择或保存一个复刻音色。");
        }
      }

      const response = await fetch("/api/tts/synthesize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-mimo-api-key": apiKey.trim(),
        },
        body: JSON.stringify({
          text,
          voiceMode,
          voiceId:
            voiceMode === "preset" ? selectedVoice.id : voiceMode === "clone" ? selectedCloneIdForRequest || "clone-local" : customVoiceName,
          voicePrompt,
          referenceAudioData,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message ?? "合成失败。");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setAudioUrl(url);
      setDownloadName(formatFileName());
      setStatusText("合成完成");
      setProgress(100);
      window.setTimeout(() => {
        audioRef.current?.play().catch(() => undefined);
      }, 120);
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : "发生未知错误。");
      setStatusText("合成失败");
      setProgress(0);
    } finally {
      window.clearInterval(timer);
      setIsGenerating(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <section className="mb-6 rounded-xl border border-slate-200 bg-white/85 px-5 py-4 shadow-panel backdrop-blur">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="mb-1 text-sm font-medium text-slate-500">DearTTS</p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">个性化语音合成工作台</h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            API Key 只保存在本地浏览器
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-panel">
            <div className="mb-4 flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-blue-600" />
              <h2 className="text-base font-semibold text-slate-900">API Key 配置</h2>
            </div>
            <div className="flex rounded-lg border border-slate-300 bg-white focus-within:border-blue-500">
              <input
                className="min-w-0 flex-1 rounded-l-lg px-3 py-2 text-sm outline-none ring-0"
                placeholder="输入 MiMo v2.5 API Key"
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                autoComplete="off"
              />
              <button
                className="inline-flex h-10 w-10 items-center justify-center rounded-r-lg text-slate-500 hover:text-slate-900"
                type="button"
                onClick={() => setShowApiKey((value) => !value)}
                title={showApiKey ? "隐藏 API Key" : "显示 API Key"}
                aria-label={showApiKey ? "隐藏 API Key" : "显示 API Key"}
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white"
                onClick={verifyApiKey}
              >
                <CheckCircle2 className="h-4 w-4" />
                验证
              </button>
              <div className="flex flex-1 items-center text-sm text-slate-600">{apiKeyMessage}</div>
            </div>
            {apiKeyStatus === "ok" ? <p className="mt-2 text-sm text-emerald-700">已验证通过。</p> : null}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-panel">
            <div className="mb-4 flex items-center gap-2">
              <MicVocal className="h-4 w-4 text-cyan-700" />
              <h2 className="text-base font-semibold text-slate-900">声音定制</h2>
            </div>

            <div className="mb-4 flex gap-2 rounded-lg bg-slate-100 p-1">
              {[
                ["preset", "预置"],
                ["design", "设计"],
                ["clone", "复刻"],
              ].map(([mode, label]) => (
                <button
                  key={mode}
                  className={`flex-1 rounded-md px-3 py-2 text-sm ${voiceMode === mode ? "bg-white shadow-sm" : "text-slate-500"}`}
                  onClick={() => setVoiceMode(mode as VoiceMode)}
                >
                  {label}
                </button>
              ))}
            </div>

            {voiceMode === "preset" ? (
              <div className="space-y-2">
                {presetVoices.map((voice) => (
                  <button
                    key={voice.id}
                    className={`w-full rounded-lg border px-3 py-3 text-left transition ${
                      selectedVoice.id === voice.id ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white"
                    }`}
                    onClick={() => setSelectedVoice(voice)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-900">{voice.name}</span>
                      <span className="text-xs text-slate-500">{voice.language.toUpperCase()}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{voice.description}</p>
                    <p className="mt-2 text-xs text-slate-500">{voice.style.join(" · ")}</p>
                  </button>
                ))}
              </div>
            ) : null}

            {voiceMode === "design" ? (
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">定制声音名称</label>
                  <input
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                    placeholder="例如：温柔播客女声"
                    value={customVoiceName}
                    onChange={(event) => setCustomVoiceName(event.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">声音描述</label>
                  <textarea
                    className="min-h-32 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                    placeholder="例如：一位温柔的年轻女性声音，语速偏慢，带轻微南方口音，适合播客和情感内容。"
                    value={voicePrompt}
                    onChange={(event) => setVoicePrompt(event.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-cyan-700 px-3 py-2 text-sm font-medium text-white"
                    type="button"
                    onClick={saveCustomVoice}
                  >
                    <Save className="h-4 w-4" />
                    {selectedCustomVoiceId ? "更新定制音色" : "保存定制音色"}
                  </button>
                  <button
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
                    type="button"
                    onClick={newCustomVoice}
                  >
                    新建
                  </button>
                </div>
                {customVoices.length ? (
                  <div className="space-y-2 border-t border-slate-200 pt-3">
                    <p className="text-sm font-medium text-slate-700">本地定制音色</p>
                    {customVoices.map((voice) => (
                      <div
                        key={voice.id}
                        className={`flex items-start gap-2 rounded-lg border p-3 ${
                          selectedCustomVoiceId === voice.id ? "border-cyan-600 bg-cyan-50" : "border-slate-200"
                        }`}
                      >
                        <button className="min-w-0 flex-1 text-left" type="button" onClick={() => selectCustomVoice(voice)}>
                          <div className="truncate text-sm font-medium text-slate-900">{voice.name}</div>
                          <div className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">{voice.prompt}</div>
                        </button>
                        <button
                          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-white hover:text-red-600"
                          type="button"
                          onClick={() => deleteCustomVoice(voice.id)}
                          title="删除定制音色"
                          aria-label="删除定制音色"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}

            {voiceMode === "clone" ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">复刻声音库</h3>
                    <p className="text-xs text-slate-500">可以保存多个复刻音色，生成时直接选择。</p>
                  </div>
                  <button
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
                    type="button"
                    onClick={() => void newCloneVoice()}
                  >
                    <Plus className="h-4 w-4" />
                    新建
                  </button>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">复刻声音名称</label>
                  <input
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                    placeholder="例如：播客男声 A"
                    value={cloneVoiceName}
                    onChange={(event) => setCloneVoiceName(event.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">维护备注</label>
                  <textarea
                    className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                    placeholder="例如：适合开场介绍，偏慢速。"
                    value={cloneVoiceMemo}
                    onChange={(event) => setCloneVoiceMemo(event.target.value)}
                  />
                </div>

                <label className="block rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    上传或替换 5-30 秒参考音频
                  </div>
                  <input
                    className="mt-3 block w-full text-sm"
                    type="file"
                    accept=".wav,.mp3,.m4a,audio/*"
                    onChange={(event) => void onCloneUpload(event.target.files?.[0] ?? null)}
                  />
                  {pendingCloneLabel ? <p className="mt-2 text-xs text-slate-500">{pendingCloneLabel}</p> : null}
                </label>

                <div className="flex gap-2">
                  <button
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-cyan-700 px-3 py-2 text-sm font-medium text-white"
                    type="button"
                    onClick={() => void saveCloneVoice()}
                  >
                    <Save className="h-4 w-4" />
                    {selectedCloneVoiceId ? "更新复刻音色" : "保存复刻音色"}
                  </button>
                  <button
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
                    type="button"
                    onClick={() => void newCloneVoice()}
                  >
                    <RotateCcw className="h-4 w-4" />
                    重置
                  </button>
                </div>

                {cloneVoices.length ? (
                  <div className="space-y-2 border-t border-slate-200 pt-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-700">已保存复刻音色</p>
                      {selectedCloneVoice ? (
                        <p className="inline-flex items-center gap-1 text-xs text-cyan-700">
                          <Volume2 className="h-3.5 w-3.5" />
                          当前选中
                        </p>
                      ) : null}
                    </div>
                    {cloneVoices.map((voice) => (
                      <div
                        key={voice.id}
                        className={`flex items-start gap-2 rounded-lg border p-3 ${
                          selectedCloneVoiceId === voice.id ? "border-cyan-600 bg-cyan-50" : "border-slate-200"
                        }`}
                      >
                        <button className="min-w-0 flex-1 text-left" type="button" onClick={() => void selectCloneVoice(voice)}>
                          <div className="truncate text-sm font-medium text-slate-900">{voice.name}</div>
                          <div className="mt-1 text-xs text-slate-500">{voice.audioLabel || "未保存音频"}</div>
                          <div className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">{voice.memo}</div>
                        </button>
                        <button
                          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-white hover:text-red-600"
                          type="button"
                          onClick={() => void deleteCloneVoice(voice.id)}
                          title="删除复刻音色"
                          aria-label="删除复刻音色"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </aside>

        <section className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-panel">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">文案输入</h2>
              <div className={`text-sm ${charCount > maxChars ? "text-red-600" : "text-slate-500"}`}>
                字数统计: {charCount}/{maxChars}
              </div>
            </div>
            <textarea
              className="min-h-60 w-full rounded-lg border border-slate-300 px-3 py-3 text-sm leading-6 outline-none focus:border-blue-500"
              placeholder="输入要转成语音的内容，支持中文、英文和中英混合。"
              value={text}
              onChange={(event) => setText(event.target.value)}
            />
            <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <p className={`text-sm ${remaining < 0 ? "text-red-600" : "text-slate-500"}`}>
                还可输入 {Math.max(0, remaining)} 字
              </p>
              <button
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                disabled={!canGenerate}
                onClick={() => void synthesize()}
              >
                <Sparkles className="h-4 w-4" />
                生成语音
              </button>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-2 text-sm text-slate-600">{statusText}</p>
            {errorText ? <p className="mt-2 text-sm text-red-600">{errorText}</p> : null}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-panel">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">音频结果</h2>
              <a
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                  audioUrl ? "bg-slate-900 text-white" : "pointer-events-none bg-slate-200 text-slate-500"
                }`}
                href={audioUrl}
                download={downloadName}
              >
                <Download className="h-4 w-4" />
                下载 WAV
              </a>
            </div>
            {audioUrl ? (
              <audio ref={audioRef} controls src={audioUrl} />
            ) : (
              <div className="flex min-h-28 items-center justify-center rounded-lg border border-dashed border-slate-200 text-sm text-slate-500">
                合成完成后可直接试听与下载
              </div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
