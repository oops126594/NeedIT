type AsrResult = { text?: string };
type Asr = (audio: Float32Array, options: { language: string; task: "transcribe" }) => Promise<AsrResult | AsrResult[]>;

type Transformers = {
  env: { allowLocalModels: boolean; useBrowserCache: boolean };
  pipeline: (
    task: "automatic-speech-recognition",
    model: string,
    options?: {
      dtype?: string;
      progress_callback?: (update: { status?: string; progress?: number }) => void;
    },
  ) => Promise<Asr>;
};

const MODULE_URL = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.6";
let model: Promise<Asr> | null = null;

async function loadModel(onProgress: (percent: number) => void): Promise<Asr> {
  if (!model) {
    model = (async () => {
      const load = new Function("specifier", "return import(specifier)") as (specifier: string) => Promise<Transformers>;
      const transformers = await load(MODULE_URL);
      transformers.env.allowLocalModels = false;
      transformers.env.useBrowserCache = true;
      return transformers.pipeline("automatic-speech-recognition", "Xenova/whisper-tiny", {
        dtype: "q8",
        progress_callback: (update) => {
          if (update.status === "progress" && typeof update.progress === "number") onProgress(Math.round(update.progress));
        },
      });
    })().catch((error: unknown) => {
      model = null;
      throw error;
    });
  }
  return model;
}

async function samplesFrom(blob: Blob): Promise<Float32Array> {
  const audio = new AudioContext();
  try {
    const decoded = await audio.decodeAudioData(await blob.arrayBuffer());
    if (decoded.numberOfChannels === 1 && decoded.sampleRate === 16000) return decoded.getChannelData(0);
    const offline = new OfflineAudioContext(1, Math.ceil(decoded.duration * 16000), 16000);
    const source = offline.createBufferSource();
    source.buffer = decoded;
    source.connect(offline.destination);
    source.start();
    const rendered = await offline.startRendering();
    return rendered.getChannelData(0);
  } finally {
    await audio.close();
  }
}

export async function transcribeSpeech(blob: Blob, locale: "ar" | "en", onProgress: (percent: number) => void): Promise<string> {
  const transcriber = await loadModel(onProgress);
  const audio = await samplesFrom(blob);
  const result = await transcriber(audio, {
    language: locale === "ar" ? "arabic" : "english",
    task: "transcribe",
  });
  const text = (Array.isArray(result) ? result[0]?.text : result.text) ?? "";
  return text.replace(/\s+/g, " ").trim();
}
