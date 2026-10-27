"use client";

import { useRouter } from "@/i18n/navigation";
import { track } from "@/lib/analytics";
import { useShop } from "@/components/shop-provider";
import { MicIcon, SearchIcon } from "@/components/icons";
import { transcribeSpeech } from "@/lib/transcribe-speech";
import { useAppLocale } from "@/components/use-app-locale";
import { useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";

type SpeechAlternative = { transcript: string };
type SpeechResultItem = ArrayLike<SpeechAlternative> & { isFinal: boolean };
type SpeechResultEvent = { resultIndex: number; results: ArrayLike<SpeechResultItem> };

type SpeechRec = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};

function createRecognition(): SpeechRec | null {
  const win = window as Window & {
    SpeechRecognition?: new () => SpeechRec;
    webkitSpeechRecognition?: new () => SpeechRec;
  };
  const Ctor = win.SpeechRecognition ?? win.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

export function SearchForm({
  initialQuery = "",
  variant = "field",
}: {
  initialQuery?: string;
  variant?: "field" | "bar";
}) {
  const t = useTranslations("Home");
  const locale = useAppLocale();
  const router = useRouter();
  const { addSearch } = useShop();
  const [value, setValue] = useState(initialQuery);
  const [error, setError] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"idle" | "listening" | "preparing">("idle");
  const fieldId = useId();
  const heard = useRef("");
  const spoke = useRef(false);
  const recognition = useRef<SpeechRec | null>(null);
  const micStream = useRef<MediaStream | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const keepListening = useRef(false);

  useEffect(() => {
    return () => {
      keepListening.current = false;
      recognition.current?.abort();
      if (recorder.current?.state === "recording") recorder.current.stop();
      micStream.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  function releaseMic() {
    micStream.current?.getTracks().forEach((track) => track.stop());
    micStream.current = null;
  }

  useEffect(() => {
    setValue(initialQuery);
  }, [initialQuery]);

  function go(query: string) {
    const next = query.trim();
    if (!next) {
      setError(true);
      return;
    }
    setError(false);
    setVoiceError(null);
    addSearch(next);
    track("search_started", { q: next });
    router.push(`/search?q=${encodeURIComponent(next)}`);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    go(value);
  }

  function stopCapture() {
    keepListening.current = false;
    recognition.current?.abort();
    recognition.current = null;
    if (recorder.current?.state === "recording") {
      recorder.current.requestData();
      recorder.current.stop();
    }
  }

  async function dictate() {
    if (phase === "preparing") return;
    if (phase === "listening") {
      stopCapture();
      return;
    }
    setVoiceError(null);
    setError(false);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setVoiceError(t("voiceUnsupported"));
      return;
    }

    let stream: MediaStream;
    try {
      releaseMic();
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStream.current = stream;
    } catch (error) {
      const name = error instanceof DOMException ? error.name : "";
      setVoiceError(name === "NotAllowedError" || name === "SecurityError" ? t("voiceDenied") : t("voiceNoMic"));
      return;
    }

    heard.current = "";
    spoke.current = false;
    keepListening.current = true;
    const chunks: Blob[] = [];
    const capture = new MediaRecorder(stream);
    recorder.current = capture;
    capture.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    capture.onstop = () => {
      releaseMic();
      const transcript = heard.current.trim();
      if (transcript) {
        setPhase("idle");
        go(transcript);
        return;
      }
      const blob = new Blob(chunks, { type: capture.mimeType || "audio/webm" });
      if (blob.size < 1000) {
        setPhase("idle");
        return;
      }
      setPhase("preparing");
      void transcribeSpeech(blob, locale, () => undefined)
        .then((text) => {
          if (text) go(text.slice(0, 80));
        })
        .catch(() => setVoiceError(t("voiceNetwork")))
        .finally(() => setPhase("idle"));
    };

    const context = new AudioContext();
    void context.resume();
    const source = context.createMediaStreamSource(stream);
    const analyser = context.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);
    const samples = new Uint8Array(analyser.fftSize);
    let quietFor = 0;
    const started = Date.now();
    const watch = window.setInterval(() => {
      if (!keepListening.current) {
        window.clearInterval(watch);
        void context.close();
        return;
      }
      analyser.getByteTimeDomainData(samples);
      let energy = 0;
      for (const sample of samples) {
        const normalized = (sample - 128) / 128;
        energy += normalized * normalized;
      }
      const level = Math.sqrt(energy / samples.length);
      if (level > 0.02) {
        spoke.current = true;
        quietFor = 0;
      } else if (spoke.current) quietFor += 100;
      const elapsed = Date.now() - started;
      if ((spoke.current && quietFor >= 1400 && elapsed > 600) || elapsed >= 15000) {
        window.clearInterval(watch);
        void context.close();
        stopCapture();
      }
    }, 100);

    const session = createRecognition();
    if (session) {
      recognition.current = session;
      session.lang = locale === "ar" ? "ar-SA" : "en-US";
      session.interimResults = true;
      session.continuous = true;
      session.maxAlternatives = 1;
      session.onresult = (event) => {
        let finalText = "";
        let interim = "";
        for (let index = 0; index < event.results.length; index += 1) {
          const result = event.results[index];
          const transcript = result?.[0]?.transcript ?? "";
          if (result?.isFinal) finalText += ` ${transcript}`;
          else interim += ` ${transcript}`;
        }
        const spoken = `${finalText} ${interim}`.replace(/\s+/g, " ").trim().slice(0, 80);
        if (spoken) {
          heard.current = spoken;
          spoke.current = true;
          setValue(spoken);
        }
        if (finalText.trim()) stopCapture();
      };
      session.onerror = (event) => {
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          keepListening.current = false;
          setVoiceError(t("voiceDenied"));
          stopCapture();
        } else if (event.error === "audio-capture") {
          keepListening.current = false;
          setVoiceError(t("voiceNoMic"));
          stopCapture();
        }
      };
      try {
        session.start();
      } catch {
        recognition.current = null;
      }
    }

    capture.start(250);
    setPhase("listening");
  }

  return (
    <form onSubmit={onSubmit} role="search" className="flex flex-col gap-2">
      <label htmlFor={fieldId} className="sr-only">
        {t("searchLabel")}
      </label>
      <div className="relative">
        <input
          id={fieldId}
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            if (error) setError(false);
          }}
          placeholder={t("placeholder")}
          maxLength={80}
          enterKeyHint="search"
          aria-invalid={error}
          aria-describedby={error ? `${fieldId}-error` : phase !== "idle" ? `${fieldId}-listening` : undefined}
          className={
            variant === "bar"
              ? "h-11 w-full rounded-2xl border border-line bg-white ps-10 pe-12 text-sm text-ink shadow-sm placeholder:text-muted focus:border-accent"
              : "h-14 w-full rounded-2xl border border-white/70 bg-white ps-11 pe-12 text-base text-ink shadow-[0_10px_30px_rgba(73,45,30,.12)] placeholder:text-muted focus:border-accent"
          }
        />
        <button
          type="submit"
          aria-label={t("searchSubmit")}
          className="absolute start-3 top-1/2 -translate-y-1/2 text-muted"
        >
          <SearchIcon className="size-4" />
        </button>
        <button
          type="button"
          aria-label={phase === "preparing" ? t("voicePreparing") : phase === "listening" ? t("voiceListening") : t("voice")}
          aria-pressed={phase !== "idle"}
          onClick={() => void dictate()}
          className={`absolute end-2 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-full ${
            phase !== "idle" ? "bg-accent text-accent-ink" : "text-muted"
          }`}
        >
          <MicIcon className="size-4" />
        </button>
      </div>
      {phase !== "idle" ? (
        <p id={`${fieldId}-listening`} className="text-sm text-accent-text">
          {phase === "preparing" ? t("voicePreparing") : t("voiceListening")}
        </p>
      ) : null}
      {voiceError ? <p className="text-sm text-danger">{voiceError}</p> : null}
      {error ? (
        <p id={`${fieldId}-error`} className="text-sm text-danger">
          {t("searchRequired")}
        </p>
      ) : null}
    </form>
  );
}
