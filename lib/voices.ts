export type PresetVoice = {
  id: string;
  name: string;
  gender: "male" | "female" | "unknown";
  language: "zh" | "en" | "mixed";
  style: string[];
  description: string;
  previewText: string;
};

export const presetVoices: PresetVoice[] = [
  {
    id: "mimo_default",
    name: "MiMo 默认",
    gender: "unknown",
    language: "mixed",
    style: ["通用", "自然", "默认"],
    description: "官方默认音色，中国集群通常为冰糖，其他集群通常为 Mia。",
    previewText: "这里是 DearTTS 语音合成演示。",
  },
  {
    id: "冰糖",
    name: "冰糖",
    gender: "female",
    language: "zh",
    style: ["中文", "女性", "清晰"],
    description: "官方中文女声音色，适合日常播报与内容旁白。",
    previewText: "愿每一段文字，都能拥有贴近心意的声音。",
  },
  {
    id: "茉莉",
    name: "茉莉",
    gender: "female",
    language: "zh",
    style: ["中文", "女性", "温柔"],
    description: "官方中文女声音色，适合温柔、叙事类内容。",
    previewText: "用温柔清晰的声音，讲述每一个重要片段。",
  },
  {
    id: "苏打",
    name: "苏打",
    gender: "male",
    language: "zh",
    style: ["中文", "男性", "明亮"],
    description: "官方中文男声音色，适合轻松活力的表达。",
    previewText: "让信息更清楚，也让表达更有节奏。",
  },
  {
    id: "白桦",
    name: "白桦",
    gender: "male",
    language: "zh",
    style: ["中文", "男性", "沉稳"],
    description: "官方中文男声音色，适合知识讲解和正式旁白。",
    previewText: "用可靠而克制的表达，讲清楚每一个重点。",
  },
  {
    id: "Mia",
    name: "Mia",
    gender: "female",
    language: "en",
    style: ["English", "female", "natural"],
    description: "官方英文女声音色，适合英文课程和产品说明。",
    previewText: "Create a natural voiceover from any script.",
  },
  {
    id: "Chloe",
    name: "Chloe",
    gender: "female",
    language: "en",
    style: ["English", "female", "bright"],
    description: "官方英文女声音色，适合明亮活泼的英文内容。",
    previewText: "Bring energy and clarity to your narration.",
  },
  {
    id: "Milo",
    name: "Milo",
    gender: "male",
    language: "en",
    style: ["English", "male", "clear"],
    description: "官方英文男声音色，适合培训和解释型内容。",
    previewText: "Make every explanation sound clear and confident.",
  },
  {
    id: "Dean",
    name: "Dean",
    gender: "male",
    language: "en",
    style: ["English", "male", "steady"],
    description: "官方英文男声音色，适合稳重旁白。",
    previewText: "A steady voice for focused storytelling.",
  },
];
