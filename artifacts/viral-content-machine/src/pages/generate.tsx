import { useState, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Sparkles, ChevronRight, Loader2, CheckCircle2, RotateCcw, Activity, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

const NICHES = [
  { value: "facts", label: "Mind-Blowing Facts" },
  { value: "psychology", label: "Psychology" },
  { value: "money", label: "Money & Finance" },
  { value: "tech", label: "Tech Secrets" },
  { value: "body", label: "Human Body" },
  { value: "dark", label: "Dark Truths" },
];

const TOPIC_COUNTS = [3, 5, 8, 10];

type GeneratedTopic = {
  id: number;
  niche: string;
  title: string;
  hook: string;
  status: string;
};

type GeneratedScript = {
  id: number;
  niche: string;
  title: string;
  hook: string;
  body: string;
  reveal: string;
  loopEnding: string;
  fullScript: string;
  durationSeconds: number;
  status: string;
};

type Step = "select-niche" | "generating-topics" | "select-topic" | "generating-script" | "script-ready";

export default function GeneratePage() {
  const searchParams = new URLSearchParams(window.location.search);
  const prefillTopicId = searchParams.get("topicId");
  const prefillTitle = searchParams.get("title");
  const prefillHook = searchParams.get("hook");
  const prefillNiche = searchParams.get("niche");

  const [step, setStep] = useState<Step>(
    prefillTopicId ? "generating-script" : "select-niche"
  );
  const [niche, setNiche] = useState(prefillNiche ?? "facts");
  const [topicCount, setTopicCount] = useState(5);
  const [topics, setTopics] = useState<GeneratedTopic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<GeneratedTopic | null>(
    prefillTopicId
      ? {
          id: Number(prefillTopicId),
          niche: prefillNiche ?? "facts",
          title: prefillTitle ?? "",
          hook: prefillHook ?? "",
          status: "pending",
        }
      : null
  );
  const [streamedScript, setStreamedScript] = useState("");
  const [generatedScript, setGeneratedScript] = useState<GeneratedScript | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const scriptBoxRef = useRef<HTMLDivElement>(null);
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (prefillTopicId && step === "generating-script") {
      generateScript({
        id: Number(prefillTopicId),
        niche: prefillNiche ?? "facts",
        title: prefillTitle ?? "",
        hook: prefillHook ?? "",
        status: "pending",
      });
    }
  }, []);

  useEffect(() => {
    if (scriptBoxRef.current) {
      scriptBoxRef.current.scrollTop = scriptBoxRef.current.scrollHeight;
    }
  }, [streamedScript]);

  const generateTopics = async () => {
    setIsLoading(true);
    setStep("generating-topics");
    try {
      const res = await fetch("/api/content/generate-topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche, count: topicCount }),
      });
      if (!res.ok) throw new Error("Failed to generate topics");
      const data = await res.json();
      setTopics(data);
      qc.invalidateQueries({ queryKey: ["listTopics"] });
      qc.invalidateQueries({ queryKey: ["getContentStats"] });
      setStep("select-topic");
    } catch {
      toast({ title: "Error", description: "Failed to generate topics. Try again.", variant: "destructive" });
      setStep("select-niche");
    } finally {
      setIsLoading(false);
    }
  };

  const generateScript = async (topic: GeneratedTopic) => {
    setSelectedTopic(topic);
    setStep("generating-script");
    setStreamedScript("");
    setGeneratedScript(null);

    try {
      const res = await fetch("/api/content/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId: topic.id,
          niche: topic.niche,
          title: topic.title,
          hook: topic.hook,
        }),
      });

      if (!res.ok || !res.body) throw new Error("Stream failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        const lines = text.split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const json = JSON.parse(line.slice(6));
            if (json.content) setStreamedScript((prev) => prev + json.content);
            if (json.done && json.script) {
              setGeneratedScript(json.script);
              setStep("script-ready");
              qc.invalidateQueries({ queryKey: ["listScripts"] });
              qc.invalidateQueries({ queryKey: ["getContentStats"] });
            }
            if (json.error) throw new Error(json.error);
          } catch {
            // non-json line
          }
        }
      }
    } catch {
      toast({ title: "Error", description: "Script generation failed. Try again.", variant: "destructive" });
      setStep("select-topic");
    }
  };

  const queueVideo = async () => {
    if (!generatedScript) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/content/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scriptId: generatedScript.id, platform: "all" }),
      });
      if (!res.ok) throw new Error("Failed");
      qc.invalidateQueries({ queryKey: ["listVideos"] });
      qc.invalidateQueries({ queryKey: ["getContentStats"] });
      toast({ title: "Video queued", description: "Script queued for video export." });
      navigate("/videos");
    } catch {
      toast({ title: "Error", description: "Could not queue video.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setStep("select-niche");
    setTopics([]);
    setSelectedTopic(null);
    setStreamedScript("");
    setGeneratedScript(null);
  };

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight uppercase">Generate</h1>
          <p className="text-muted-foreground uppercase text-sm tracking-widest mt-1">
            AI-powered content pipeline
          </p>
        </div>
        {step !== "select-niche" && (
          <button
            onClick={reset}
            className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 text-xs uppercase tracking-wider"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        )}
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider">
        {[
          { id: "select-niche", label: "1. Niche" },
          { id: "select-topic", label: "2. Topic" },
          { id: "script-ready", label: "3. Script" },
        ].map(({ id, label }, i) => {
          const steps = ["select-niche", "generating-topics", "select-topic", "generating-script", "script-ready"];
          const currentIdx = steps.indexOf(step);
          const myIdx = steps.indexOf(id);
          const active = currentIdx >= myIdx;
          return (
            <div key={id} className="flex items-center gap-2">
              {i > 0 && <div className={cn("w-8 h-px", active ? "bg-primary" : "bg-border")} />}
              <span className={cn(active ? "text-primary" : "text-muted-foreground")}>{label}</span>
            </div>
          );
        })}
      </div>

      {/* Step: Select Niche */}
      {step === "select-niche" && (
        <div className="space-y-6">
          <div className="p-6 border border-border bg-card space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-widest">Choose Your Niche</h2>
            <div className="grid grid-cols-2 gap-3">
              {NICHES.map((n) => (
                <button
                  key={n.value}
                  onClick={() => setNiche(n.value)}
                  className={cn(
                    "p-4 border text-left transition-colors",
                    niche === n.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <p className="text-xs font-bold uppercase tracking-wider">{n.label}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 border border-border bg-card space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-widest">Number of Topics</h2>
            <div className="flex gap-3">
              {TOPIC_COUNTS.map((c) => (
                <button
                  key={c}
                  onClick={() => setTopicCount(c)}
                  className={cn(
                    "w-16 h-12 border text-sm font-bold transition-colors",
                    topicCount === c
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50 text-muted-foreground"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={generateTopics} className="w-full uppercase tracking-widest" size="lg">
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Topics
          </Button>
        </div>
      )}

      {/* Step: Generating Topics */}
      {step === "generating-topics" && (
        <div className="p-12 border border-border bg-card flex flex-col items-center justify-center gap-4 text-center">
          <div className="w-12 h-12 border border-primary flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-primary animate-pulse" />
          </div>
          <div>
            <p className="font-bold uppercase tracking-widest">Mining Topics</p>
            <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">
              AI is generating {topicCount} viral ideas for {niche}...
            </p>
          </div>
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Step: Select Topic */}
      {step === "select-topic" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm uppercase tracking-widest text-muted-foreground">
              Select a topic to script
            </p>
            <button
              onClick={() => setStep("select-niche")}
              className="text-xs text-muted-foreground hover:text-foreground uppercase tracking-wider"
            >
              Regenerate
            </button>
          </div>
          <div className="space-y-2">
            {topics.map((topic) => (
              <button
                key={topic.id}
                onClick={() => generateScript(topic)}
                className="w-full p-5 border border-border bg-card hover:border-primary/50 transition-colors text-left group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{topic.title}</p>
                    {topic.hook && (
                      <p className="text-xs text-muted-foreground mt-1 italic">"{topic.hook}"</p>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-0.5" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step: Generating Script */}
      {step === "generating-script" && (
        <div className="space-y-4">
          {selectedTopic && (
            <div className="p-4 border border-primary/30 bg-primary/5">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Writing script for</p>
              <p className="text-sm font-medium">{selectedTopic.title}</p>
            </div>
          )}
          <div className="p-6 border border-border bg-card space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary animate-pulse" />
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Streaming script...</p>
            </div>
            <div
              ref={scriptBoxRef}
              className="font-mono text-xs bg-secondary p-4 min-h-32 max-h-64 overflow-y-auto whitespace-pre-wrap leading-relaxed"
            >
              {streamedScript || (
                <span className="text-muted-foreground">Generating...</span>
              )}
              <span className="inline-block w-1.5 h-3 bg-primary animate-pulse ml-0.5 align-middle" />
            </div>
          </div>
        </div>
      )}

      {/* Step: Script Ready */}
      {step === "script-ready" && generatedScript && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <CheckCircle2 className="w-5 h-5" />
            <p className="text-sm uppercase tracking-widest font-bold">Script Ready</p>
          </div>

          <div className="p-6 border border-border bg-card space-y-4">
            <h3 className="font-bold text-sm">{generatedScript.title}</h3>

            {[
              { label: "Hook", value: generatedScript.hook },
              { label: "Build", value: generatedScript.body },
              { label: "Reveal", value: generatedScript.reveal },
              { label: "Loop Ending", value: generatedScript.loopEnding },
            ].map(({ label, value }) => value && (
              <div key={label} className="space-y-1">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
                <p className="text-sm bg-secondary p-3 leading-relaxed">{value}</p>
              </div>
            ))}

            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              ~{generatedScript.durationSeconds}s duration
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={queueVideo}
              disabled={isLoading}
              className="flex-1 uppercase tracking-widest"
              size="lg"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ChevronRight className="w-4 h-4 mr-2" />}
              Queue for Export
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/scripts")}
              className="uppercase tracking-widest"
            >
              View Scripts
            </Button>
          </div>

          <Button
            variant="ghost"
            onClick={reset}
            className="w-full uppercase tracking-widest text-xs text-muted-foreground"
          >
            Generate Another
          </Button>
        </div>
      )}
    </div>
  );
}
