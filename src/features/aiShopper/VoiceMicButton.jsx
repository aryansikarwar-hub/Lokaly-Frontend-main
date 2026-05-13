/**
 * VoiceMicButton — drop-in mic with waveform animation + language picker.
 *
 * Wraps `react-speech-recognition` (which sits on top of the browser's
 * webkitSpeechRecognition / SpeechRecognition API). Browser support is
 * Chromium-only on desktop; on iOS Safari it falls back to non-functional —
 * we detect that and disable the button with a friendly message.
 *
 * Props:
 *   - onFinalTranscript(text, langCode): fires once when the user stops
 *   - onInterim(text): fires on every interim chunk (live preview)
 *   - lang / onLangChange: controlled language picker
 *   - languages: array of { code, label, native } to show in dropdown
 *   - compact: render the small inline version (no language picker)
 */
import { useEffect, useRef } from 'react';
import 'regenerator-runtime/runtime';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { motion, AnimatePresence } from 'framer-motion';
import { TbMicrophone, TbMicrophoneOff } from 'react-icons/tb';
import { HiOutlineChevronDown } from 'react-icons/hi2';
import { useState } from 'react';

export default function VoiceMicButton({
  onFinalTranscript,
  onInterim,
  lang = 'en-IN',
  onLangChange,
  languages,
  compact = false,
  busy = false,
}) {
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
  } = useSpeechRecognition();

  const [pickerOpen, setPickerOpen] = useState(false);
  const lastFinalRef = useRef('');
  const idleTimerRef = useRef(null);

  // Stream interim transcript up to parent
  useEffect(() => {
    if (listening && transcript) onInterim?.(transcript);
  }, [transcript, listening, onInterim]);

  // Auto-stop after 2s of silence (mimics a "natural" pause). On stop we
  // emit the final transcript exactly once.
  useEffect(() => {
    if (!listening) return;
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (!transcript) return;
    idleTimerRef.current = setTimeout(() => {
      stopAndSubmit();
    }, 2000);
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript, listening]);

  async function start() {
    if (busy) return;
    resetTranscript();
    lastFinalRef.current = '';
    try {
      await SpeechRecognition.startListening({ continuous: true, language: lang });
    } catch (err) {
      console.error('[mic] start failed', err);
    }
  }

  async function stopAndSubmit() {
    SpeechRecognition.stopListening();
    const text = (transcript || '').trim();
    if (text && text !== lastFinalRef.current) {
      lastFinalRef.current = text;
      onFinalTranscript?.(text, lang);
    }
    resetTranscript();
  }

  async function toggle() {
    if (listening) await stopAndSubmit();
    else await start();
  }

  if (!browserSupportsSpeechRecognition) {
    return (
      <button
        type="button"
        disabled
        title="Voice input requires Chrome / Edge / Safari (recent)"
        className="w-11 h-11 rounded-full bg-white/60 text-ink/30 grid place-items-center cursor-not-allowed"
      >
        <TbMicrophoneOff />
      </button>
    );
  }

  const currentLang = languages?.find((l) => l.code === lang) || { native: 'EN' };

  return (
    <div className="flex items-center gap-1">
      {/* Language picker */}
      {!compact && languages && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setPickerOpen((v) => !v)}
            className="h-9 px-2.5 rounded-full bg-white dark:bg-white/10 border border-ink/10 dark:border-white/10 text-[11px] font-jakarta font-bold text-ink dark:text-cream flex items-center gap-1 hover:bg-peach/30"
          >
            {currentLang.native}
            <HiOutlineChevronDown className="text-[10px]" />
          </button>
          <AnimatePresence>
            {pickerOpen && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.12 }}
                className="absolute bottom-full mb-1 left-0 z-20 bg-white dark:bg-[#3A3349] rounded-xl shadow-lg border border-ink/10 dark:border-white/10 py-1 min-w-[140px] max-h-60 overflow-y-auto"
              >
                {languages.map((l) => (
                  <button
                    type="button"
                    key={l.code}
                    onClick={() => {
                      onLangChange?.(l.code);
                      setPickerOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs font-jakarta hover:bg-peach/40 dark:hover:bg-white/10 ${
                      l.code === lang ? 'text-coral font-bold' : 'text-ink dark:text-cream'
                    }`}
                  >
                    {l.name || l.label} <span className="text-ink/40">{l.native}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Mic button with animated halo */}
      <button
        type="button"
        onClick={toggle}
        disabled={busy || !isMicrophoneAvailable}
        title={listening ? 'Stop listening' : 'Tap to speak'}
        className="relative w-11 h-11 rounded-full grid place-items-center text-white disabled:opacity-50"
        style={{
          backgroundColor: listening ? '#E85A5A' : '#1F1A2B',
          boxShadow: listening
            ? '0 0 0 0 rgba(232,90,90,0.6)'
            : '0 4px 10px rgba(0,0,0,0.15)',
        }}
      >
        {listening && (
          <>
            <motion.span
              className="absolute inset-0 rounded-full"
              style={{ backgroundColor: '#E85A5A', opacity: 0.4 }}
              animate={{ scale: [1, 1.6, 1.6], opacity: [0.4, 0, 0] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
            />
            <motion.span
              className="absolute inset-0 rounded-full"
              style={{ backgroundColor: '#E85A5A', opacity: 0.3 }}
              animate={{ scale: [1, 1.9, 1.9], opacity: [0.3, 0, 0] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut', delay: 0.5 }}
            />
          </>
        )}
        <TbMicrophone className="relative z-10 text-lg" />
      </button>
    </div>
  );
}
