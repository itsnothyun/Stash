import React, { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Check } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils/cn";
import { stashIpc } from "@/lib/ipc/stash-ipc";

interface VoiceDictationButtonProps {
  onInsertText: (text: string) => void;
  className?: string;
  iconButtonClass?: string;
}

export const VoiceDictationButton: React.FC<VoiceDictationButtonProps> = ({
  onInsertText,
  className,
  iconButtonClass,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState("");
  const recognitionRef = useRef<any>(null);
  const accumulatedRef = useRef<string>("");

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore
      }
    }
    setIsListening(false);

    const textToInsert = accumulatedRef.current.trim();
    if (textToInsert) {
      // Capitalize first letter and format
      const formatted = textToInsert.charAt(0).toUpperCase() + textToInsert.slice(1);
      onInsertText(` ${formatted} `);
      toast.show({
        message: `Dictation added (${textToInsert.split(/\s+/).length} words)`,
      });
    }

    accumulatedRef.current = "";
    setInterimText("");
  }, [onInsertText]);

  const handleOpenSettings = useCallback(async () => {
    try {
      await stashIpc.openMicrophoneSettings();
    } catch (e) {
      console.error("Failed to open microphone settings:", e);
    }
  }, []);

  const startListening = useCallback(async () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      await handleOpenSettings();
      toast.show({
        message: "Speech recognition unavailable",
        description:
          "Opening Windows Settings so you can enable speech and microphone permissions.",
        action: {
          label: "Open Settings",
          onClick: handleOpenSettings,
        },
        duration: 8000,
        variant: "destructive",
      });
      return;
    }

    // Proactively verify microphone hardware permission
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Immediately release tracks so speech recognition can access the device
        stream.getTracks().forEach((track) => track.stop());
      } catch (micErr: any) {
        console.warn("Microphone access check failed:", micErr);
        await handleOpenSettings();
        toast.show({
          message: "Microphone permission required",
          description:
            "Opening Windows Settings. Please ensure 'Microphone access' and desktop app access are turned ON.",
          action: {
            label: "Open Settings",
            onClick: handleOpenSettings,
          },
          duration: 8000,
          variant: "destructive",
        });
        setIsListening(false);
        return;
      }
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = navigator.language || "en-US";

      accumulatedRef.current = "";
      setInterimText("");

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let currentInterim = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            accumulatedRef.current += (accumulatedRef.current ? " " : "") + item[0].transcript;
          } else {
            currentInterim += item[0].transcript;
          }
        }
        setInterimText(currentInterim);
      };

      recognition.onerror = async (event: any) => {
        console.warn("Speech recognition error:", event.error);
        if (
          event.error === "not-allowed" ||
          event.error === "audio-capture" ||
          event.error === "service-not-allowed"
        ) {
          await handleOpenSettings();
          toast.show({
            message: "Microphone access required",
            description:
              "Opening Windows Settings so you can enable microphone permissions for Stash.",
            action: {
              label: "Open Settings",
              onClick: handleOpenSettings,
            },
            duration: 8000,
            variant: "destructive",
          });
        } else if (event.error !== "no-speech") {
          toast.show({ message: `Dictation ended: ${event.error}` });
        }
        stopListening();
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      await handleOpenSettings();
      toast.show({
        message: "Microphone dictation unavailable",
        description:
          "Opening Windows Settings so you can check microphone permissions.",
        action: {
          label: "Open Settings",
          onClick: handleOpenSettings,
        },
        duration: 8000,
        variant: "destructive",
      });
      setIsListening(false);
    }
  }, [handleOpenSettings, stopListening]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignore
        }
      }
    };
  }, []);

  const handleToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className={cn("relative inline-flex items-center", className)}>
      <button
        type="button"
        onClick={handleToggle}
        onContextMenu={async (e) => {
          e.preventDefault();
          await handleOpenSettings();
          toast.show({
            message: "Opening Windows Settings",
            description:
              "Ensure microphone access is enabled for desktop applications.",
            action: {
              label: "Reopen Settings",
              onClick: handleOpenSettings,
            },
            duration: 6000,
          });
        }}
        title={
          isListening
            ? "Stop dictation and insert text"
            : "Dictate voice note (Speech-to-Text). Right-click to open Windows Settings."
        }
        aria-label="Toggle voice dictation"
        className={cn(
          iconButtonClass,
          isListening &&
            "bg-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-500/30 ring-1 ring-rose-500/40 animate-pulse"
        )}
      >
        {isListening ? (
          <div className="relative flex items-center justify-center">
            <Mic className="h-3.5 w-3.5" />
            <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
          </div>
        ) : (
          <Mic className="h-3.5 w-3.5" />
        )}
      </button>

      {/* Floating active dictation pill while listening */}
      {isListening && (
        <div className="fixed bottom-14 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full border border-rose-500/40 bg-background/95 px-3 py-1.5 shadow-xl backdrop-blur-md text-xs select-none">
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
            <span className="font-semibold text-rose-600 dark:text-rose-400">Listening…</span>
          </div>

          <div className="max-w-[200px] truncate text-[11px] text-muted-foreground italic">
            {interimText || accumulatedRef.current || "Speak your thoughts…"}
          </div>

          <button
            type="button"
            onClick={stopListening}
            className="flex items-center gap-1 rounded bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Check className="h-3 w-3" />
            <span>Done</span>
          </button>
        </div>
      )}
    </div>
  );
};
