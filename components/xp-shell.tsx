"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "../app/page.module.css";
import { siteConfig } from "@/lib/site-config";

type SectionKey = "signal" | "fragments" | "void" | "archive" | "secret";

type FragmentSelection = (typeof siteConfig.fragments)[number];

const signalSequence = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];

const navItems: { key: SectionKey; label: string }[] = [
  { key: "signal", label: "01 / SIGNAL" },
  { key: "fragments", label: "02 / FRAGMENTS" },
  { key: "void", label: "03 / VOID" },
  { key: "archive", label: "04 / ARCHIVE" },
  { key: "secret", label: "05 / ?" },
];

const getDeviceLabel = () => {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return "iPhone";
  if (/Android/i.test(ua)) return "Android";
  if (/Mac/i.test(ua)) return "Desktop";
  return "Desktop";
};

export function XpShell() {
  const [bootProgress, setBootProgress] = useState(0);
  const [bootReady, setBootReady] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionKey>("signal");
  const [signalActive, setSignalActive] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [fragmentOpen, setFragmentOpen] = useState<FragmentSelection | null>(null);
  const [secretUnlocked, setSecretUnlocked] = useState(false);
  const [secretClicks, setSecretClicks] = useState(0);
  const [altMode, setAltMode] = useState(false);
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [voidPoint, setVoidPoint] = useState({ x: 50, y: 50 });
  const [voidTextVisible, setVoidTextVisible] = useState(false);
  const [archiveOpenItem, setArchiveOpenItem] = useState<(typeof siteConfig.archiveItems)[number] | null>(null);
  const [signalTexts, setSignalTexts] = useState<string[]>([]);
  const sequenceRef = useRef<string[]>([]);
  const audioSynthRef = useRef<{ oscillator: OscillatorNode; gain: GainNode; context: AudioContext } | null>(null);

  useEffect(() => {
    if (hasEntered || bootReady) return;

    const interval = window.setInterval(() => {
      setBootProgress((previous) => {
        if (previous >= 100) {
          window.clearInterval(interval);
          return 100;
        }
        return previous + 1;
      });
    }, 30);

    return () => window.clearInterval(interval);
  }, [hasEntered, bootReady]);

  useEffect(() => {
    if (bootProgress >= 100) {
      const checkpoint = window.setTimeout(() => setBootReady(true), 1100);
      return () => window.clearTimeout(checkpoint);
    }
  }, [bootProgress]);

  useEffect(() => {
    if (!hasEntered) return;

    const payload = {
      page: "/",
      section: activeSection,
      referrer: document.referrer || "direct",
      device: getDeviceLabel(),
      browser: navigator.userAgent.includes("Chrome") ? "Chrome" : "Unknown",
      platform: navigator.platform || "unknown",
      session: "XP-SESSION",
    };

    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => undefined);
  }, [activeSection, hasEntered]);

  useEffect(() => {
    if (!signalActive || !soundOn) {
      if (audioSynthRef.current) {
        const { oscillator, gain, context } = audioSynthRef.current;
        gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.3);
        oscillator.stop(context.currentTime + 0.4);
        audioSynthRef.current = null;
      }
      return;
    }

    const AudioContextConstructor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextConstructor) return;

    const context = new AudioContextConstructor();
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = 56;
    gain.gain.value = 0.012;

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();

    audioSynthRef.current = { oscillator, gain, context };

    return () => {
      if (!audioSynthRef.current) return;
      const { oscillator, gain, context } = audioSynthRef.current;
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.1);
      oscillator.stop(context.currentTime + 0.2);
      audioSynthRef.current = null;
    };
  }, [signalActive, soundOn]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      sequenceRef.current = [...sequenceRef.current, event.key];
      if (sequenceRef.current.length > signalSequence.length) {
        sequenceRef.current = sequenceRef.current.slice(-signalSequence.length);
      }

      const trigger = signalSequence.every((key, index) => sequenceRef.current[index] === key);
      if (trigger) {
        setSecretUnlocked(true);
        setActiveSection("secret");
        sequenceRef.current = [];
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onPointerMove = (event: PointerEvent) => {
      setCursor({ x: event.clientX, y: event.clientY });
      if (activeSection === "void") {
        setVoidPoint({ x: (event.clientX / window.innerWidth) * 100, y: (event.clientY / window.innerHeight) * 100 });
        setVoidTextVisible(true);
      }
    };

    window.addEventListener("pointermove", onPointerMove);
    return () => window.removeEventListener("pointermove", onPointerMove);
  }, [activeSection]);

  useEffect(() => {
    if (!signalActive) return;
    const burst = window.setTimeout(() => {
      setSignalTexts((previous) => {
        const next = [...previous, siteConfig.signalMessages[previous.length % siteConfig.signalMessages.length]];
        return next.slice(-5);
      });
    }, 600);

    return () => window.clearTimeout(burst);
  }, [signalActive, signalTexts.length]);

  const runtimeAccent = useMemo(
    () => (altMode ? siteConfig.alternateAccentColor : siteConfig.accentColor),
    [altMode],
  );

  const handleSignalActivate = () => {
    setSignalActive((current) => !current);
    setSignalTexts((previous) => previous.length > 0 ? previous : ["TRACE FOUND"]);
  };

  const handleSecretActivate = () => {
    setSecretClicks((count) => {
      const next = count + 1;
      if (next >= 5) {
        setSecretUnlocked(true);
        setActiveSection("secret");
      }
      return next;
    });
  };

  const handleEnter = () => {
    setHasEntered(true);
    setActiveSection("signal");
  };

  const handleXpClick = () => {
    setAltMode((current) => !current);
  };

  return (
    <div
      className={styles.appShell}
      style={{
        ["--accent" as string]: runtimeAccent,
      }}
    >
      {!hasEntered && (
        <div className={styles.bootScreen}>
          <div className={styles.bootFrame}>
            <div className={styles.bootHeader}>PROTOCOL // XP</div>
            <div className={styles.progressWrap}>
              <div className={styles.progressBar} style={{ width: `${bootProgress}%` }} />
            </div>
            <div className={styles.bootStatus}>{bootProgress >= 100 ? "CONNECTION ESTABLISHED" : "INITIALIZING..."}</div>
          </div>
          {bootReady && (
            <div className={styles.bootReveal}>
              <div className={styles.xpSignal}>.XP</div>
              <button className={styles.enterButton} onClick={handleEnter}>ENTER</button>
            </div>
          )}
        </div>
      )}

      {hasEntered && (
        <div className={styles.archiveShell}>
          <div className={styles.topBar}>
            <button className={styles.brand} onClick={handleXpClick}>.XP</button>
            <div className={styles.sessionTag}>SESSION // 001</div>
          </div>

          <header className={styles.mainHeader}>
            <div>
              <div className={styles.headerTag}>ARCHIVE</div>
              <div className={styles.headerUnknown}>UNKNOWN</div>
            </div>
            <button className={styles.audioToggle} onClick={() => setSoundOn((value) => !value)}>
              SOUND // {soundOn ? "ON" : "OFF"}
            </button>
          </header>

          <nav className={styles.nav} aria-label="Archive navigation">
            {navItems.map((item) => (
              <button
                key={item.key}
                className={`${styles.navItem} ${activeSection === item.key ? styles.navItemActive : ""}`}
                onClick={() => setActiveSection(item.key)}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {activeSection === "signal" && (
            <section className={styles.signalSection}>
              <div className={styles.signalHeader}>
                <span>SIGNAL // XP-01</span>
                <span className={styles.signalStatus}>STATUS: {signalActive ? "ACTIVE" : "STANDBY"}</span>
              </div>

              <div className={styles.signalGrid}>
                <div>
                  <div className={styles.fieldLabel}>FREQUENCY</div>
                  <div className={styles.fieldValue}>UNKNOWN</div>
                </div>
                <div>
                  <div className={styles.fieldLabel}>SOURCE</div>
                  <div className={styles.fieldValue}>UNKNOWN</div>
                </div>
              </div>

              <div className={`${styles.waveHolder} ${signalActive ? styles.waveHolderActive : ""}`}>
                {Array.from({ length: 32 }).map((_, index) => (
                  <span
                    key={index}
                    className={styles.waveBar}
                    style={{
                      height: `${20 + ((index * 17) % 50)}%`,
                      animationDelay: `${index * 0.08}s`,
                    }}
                  />
                ))}
              </div>

              <button className={styles.primaryAction} onClick={handleSignalActivate}>
                {signalActive ? "DISABLE SIGNAL" : "ACTIVATE SIGNAL"}
              </button>

              {signalActive && (
                <div className={styles.signalLog}>
                  <div className={styles.logLine}>.XP</div>
                  <div className={styles.logLine}>not a file extension.</div>
                  {signalTexts.map((text, index) => (
                    <div key={`${text}-${index}`} className={styles.logLine}>
                      {text}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {activeSection === "fragments" && (
            <section className={styles.fragmentsSection}>
              {siteConfig.fragments.map((fragment) => (
                <button
                  key={fragment.id}
                  className={styles.fragmentCard}
                  onClick={() => setFragmentOpen(fragment)}
                  style={{ background: fragment.tone }}
                >
                  <div className={styles.fragmentMeta}>{fragment.label}</div>
                  <div className={styles.fragmentMetaRow}>
                    <span>{fragment.id}</span>
                    <span>{fragment.status}</span>
                  </div>
                </button>
              ))}
            </section>
          )}

          {activeSection === "void" && (
            <section className={styles.voidSection}>
              <div
                className={styles.voidPoint}
                style={{ left: `${voidPoint.x}%`, top: `${voidPoint.y}%` }}
              />
              {voidTextVisible && <div className={styles.voidText}>YOU ARE STILL HERE.</div>}
            </section>
          )}

          {activeSection === "archive" && (
            <section className={styles.archiveSection}>
              <div className={styles.archiveTree}>/XP_ARCHIVE</div>
              <div className={styles.archiveList}>
                {siteConfig.archiveItems.map((item) => (
                  <button key={item.id} className={styles.archiveRow} onClick={() => setArchiveOpenItem(item)}>
                    <span className={styles.archiveNode}>{item.kind === "folder" ? "├──" : "└──"}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {activeSection === "secret" && (
            <section className={`${styles.secretSection} ${secretUnlocked ? styles.secretSectionUnlocked : ""}`}>
              {!secretUnlocked ? (
                <div className={styles.secretPrompt} title={secretClicks > 0 ? `attempts:${secretClicks}` : undefined}>
                  {secretClicks > 0 ? secretClicks : "?"}
                </div>
              ) : (
                <div className={styles.secretRoom}>
                  <div className={styles.secretLabel}>ACCESS LEVEL: XP-∞</div>
                  <div className={styles.secretWelcome}>WELCOME BACK.</div>
                  <div className={styles.secretFrame}>There is no exit. Only repetition.</div>
                </div>
              )}
            </section>
          )}

          {activeSection === "secret" && !secretUnlocked && (
            <button className={styles.secretTrigger} onClick={handleSecretActivate}>
              ?
            </button>
          )}

          {fragmentOpen && (
            <div className={styles.modal} onClick={() => setFragmentOpen(null)}>
              <div className={styles.modalCard} onClick={(event) => event.stopPropagation()}>
                <div className={styles.modalHeader}>
                  <span>{fragmentOpen.label}</span>
                  <button className={styles.modalClose} onClick={() => setFragmentOpen(null)}>×</button>
                </div>
                <div className={styles.modalArtwork} style={{ background: fragmentOpen.tone }} />
                <div className={styles.modalMeta}>
                  <span>FILE: {fragmentOpen.id}</span>
                  <span>STATUS: {fragmentOpen.status}</span>
                  <span>ORIGIN: UNKNOWN</span>
                </div>
              </div>
            </div>
          )}

          {archiveOpenItem && (
            <div className={styles.modal} onClick={() => setArchiveOpenItem(null)}>
              <div className={styles.modalCard} onClick={(event) => event.stopPropagation()}>
                <div className={styles.modalHeader}>
                  <span>{archiveOpenItem.label}</span>
                  <button className={styles.modalClose} onClick={() => setArchiveOpenItem(null)}>×</button>
                </div>
                <div className={styles.archiveContent}>
                  {archiveOpenItem.secret ? (
                    <>
                      <div className={styles.archiveDetail}>{"// ACCESS / "}{archiveOpenItem.label}</div>
                      <div className={styles.archiveText}>{archiveOpenItem.secret}</div>
                    </>
                  ) : (
                    <div className={styles.archiveText}>NO SIGNAL. ONLY STATIC.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {typeof window !== "undefined" && window.innerWidth > 768 && (
            <div
              className={styles.cursor}
              style={{ transform: `translate(${cursor.x}px, ${cursor.y}px)` }}
            />
          )}
        </div>
      )}
    </div>
  );
}
