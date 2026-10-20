import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import CustomTextPicker from './components/CustomTextPicker'
import Header from './components/Header'
import HistoryPanel from './components/HistoryPanel'
import ModePicker from './components/ModePicker'
import Results from './components/Results'
import SettingsToggles from './components/SettingsToggles'
import StatsBar from './components/StatsBar'
import TypingArea from './components/TypingArea'
import WeakKeysPanel from './components/WeakKeysPanel'
import ShareDialog from './features/share/ShareDialog'
import UpdateToast from './features/pwa/UpdateToast'
import { useInstallPrompt } from './features/pwa/useInstallPrompt'
import { usePwaUpdates } from './features/pwa/usePwaUpdates'
import { useTypingTest } from './hooks/useTypingTest'
import { calcStats } from './utils/stats'
import {
  clearHistory as clearStoredHistory,
  dismissIosInstallHint,
  derivePersonalBest,
  HISTORY_LIMIT,
  isIosInstallHintDismissed,
  loadAppData,
  resetWeakKeys as resetStoredWeakKeys,
  savePreferences,
  saveResult,
  type AppData,
  type Preferences,
  type TestResult,
} from './utils/storage'
import { createTestResult } from './utils/results'
import type { Mode } from './utils/words'

type View = 'test' | 'history' | 'weak-keys'

export default function App() {
  const [data, setData] = useState<AppData>(loadAppData)
  const [view, setView] = useState<View>('test')
  const [storageAvailable, setStorageAvailable] = useState(true)
  const [completedResult, setCompletedResult] = useState<TestResult | null>(null)
  const [shareResult, setShareResult] = useState<TestResult | null>(null)
  const [online, setOnline] = useState(navigator.onLine)
  const [iosHintDismissed, setIosHintDismissed] = useState(isIosInstallHintDismissed)
  const [installMessage, setInstallMessage] = useState('')
  const shareTriggerRef = useRef<HTMLButtonElement | null>(null)
  const installPrompt = useInstallPrompt()
  const pwaUpdates = usePwaUpdates()
  const submittedVersion = useRef<number | null>(null)
  const preferences = data.preferences
  const testConfig = useMemo(
    () => ({ ...preferences, weakKeys: data.weakKeys }),
    [preferences, data.weakKeys],
  )
  const {
    text,
    statsText,
    statsTyped,
    language,
    usedWeakKeyFallback,
    typed,
    status,
    elapsed,
    totalKeystrokes,
    correctKeystrokes,
    focusVersion,
    onType,
    restart,
    newText,
    wpmSamples,
    weakKeyStats,
  } = useTypingTest(testConfig)
  const stats = useMemo(
    () => calcStats(statsText, statsTyped, elapsed, totalKeystrokes, correctKeystrokes),
    [statsText, statsTyped, elapsed, totalKeystrokes, correctKeystrokes],
  )
  const personalBest = useMemo(() => derivePersonalBest(data.history, preferences), [data.history, preferences])
  const showIosInstallHint = installPrompt.isIos && !installPrompt.isInstalled && !iosHintDismissed

  useEffect(() => {
    const updateOnlineStatus = () => setOnline(navigator.onLine)
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }, [])

  useEffect(() => {
    if (status !== 'finished' || submittedVersion.current === focusVersion) return
    submittedVersion.current = focusVersion
    const result = createTestResult({
      preferences,
      text: statsText,
      language,
      elapsedSec: elapsed,
      stats,
      wpmSamples,
      weakKeyStats,
    })
    setCompletedResult(result)
    const saved = saveResult(result)
    setStorageAvailable(saved)
    setData((previous) => {
      const nextWeakKeys = { ...previous.weakKeys }
      for (const [key, counter] of Object.entries(result.weakKeyStats)) {
        const current = nextWeakKeys[key] ?? { attempts: 0, errors: 0 }
        nextWeakKeys[key] = {
          attempts: current.attempts + counter.attempts,
          errors: current.errors + counter.errors,
        }
      }
      return {
        ...previous,
        history: [...previous.history, result].slice(-HISTORY_LIMIT),
        weakKeys: nextWeakKeys,
      }
    })
  }, [status, focusVersion, preferences, statsText, language, elapsed, stats, wpmSamples, weakKeyStats])

  const updatePreferences = useCallback((update: (current: Preferences) => Preferences) => {
    const preferencesNext = update(preferences)
    setStorageAvailable(savePreferences(preferencesNext))
    setData((previous) => ({ ...previous, preferences: preferencesNext }))
  }, [preferences])

  const handleModeChange = useCallback((mode: Mode) => {
    updatePreferences((current) => ({ ...current, mode }))
  }, [updatePreferences])

  const handleSettingsChange = useCallback((settings: Preferences['settings']) => {
    updatePreferences((current) => ({ ...current, settings }))
  }, [updatePreferences])

  const handleClearHistory = useCallback(() => {
    const saved = clearStoredHistory()
    setStorageAvailable(saved)
    setData((previous) => ({ ...previous, history: [] }))
  }, [])

  const handleResetWeakKeys = useCallback(() => {
    const saved = resetStoredWeakKeys()
    setStorageAvailable(saved)
    setData((previous) => ({ ...previous, weakKeys: {} }))
  }, [])

  const openShare = useCallback((result: TestResult, trigger: HTMLButtonElement) => {
    shareTriggerRef.current = trigger
    setShareResult(result)
  }, [])

  const closeShare = useCallback(() => setShareResult(null), [])

  const dismissIosHint = useCallback(() => {
    if (!dismissIosInstallHint()) setInstallMessage('This browser could not save the hint dismissal.')
    setIosHintDismissed(true)
  }, [])

  const installApp = useCallback(async () => {
    const result = await installPrompt.promptInstall()
    if (result === 'error') setInstallMessage('The install prompt could not be opened.')
    else if (result === 'dismissed') setInstallMessage('Install dismissed.')
    else setInstallMessage('')
  }, [installPrompt])

  const changeWordCount = useCallback((wordCount: Preferences['wordCount']) => {
    updatePreferences((current) => ({ ...current, wordCount }))
  }, [updatePreferences])

  const changeDuration = useCallback((duration: number) => {
    updatePreferences((current) => ({ ...current, duration }))
  }, [updatePreferences])

  const changeCustomText = useCallback((customText: string) => {
    updatePreferences((current) => ({ ...current, customText }))
  }, [updatePreferences])

  const pickerDisabled = status === 'running'

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <Header />
        <div className="flex flex-wrap items-center gap-2">
          <nav aria-label="Main views" className="flex flex-wrap gap-2">
            {([
              ['test', 'Test'],
              ['history', 'History'],
              ['weak-keys', 'Weak keys'],
            ] as const).map(([target, label]) => (
              <button
                key={target}
                type="button"
                aria-current={view === target ? 'page' : undefined}
                onClick={() => setView(target)}
                className={`rounded-md px-3 py-2 text-sm transition-colors ${
                  view === target ? 'bg-brand-500 font-semibold text-slate-950' : 'bg-slate-900 text-slate-300 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
          {installPrompt.canInstall && (
            <button type="button" onClick={() => void installApp()} className="rounded-md border border-brand-500 px-3 py-2 text-sm font-semibold text-brand-200 hover:bg-brand-950">
              Install app
            </button>
          )}
        </div>
      </header>

      {showIosInstallHint && (
        <aside className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-700 bg-slate-900/70 p-3 text-sm text-slate-200">
          <p>To install TypeShyt, tap Share, then Add to Home Screen.</p>
          <button type="button" onClick={dismissIosHint} className="rounded-md px-3 py-2 text-brand-200 hover:bg-slate-800">
            Dismiss
          </button>
        </aside>
      )}
      {installMessage && <p role="status" aria-live="polite" className="text-sm text-slate-300">{installMessage}</p>}

      <main className="flex flex-1 flex-col gap-6">
        {view === 'history' ? (
          <HistoryPanel history={data.history} legacyBests={data.legacyBests} onShare={openShare} onClear={handleClearHistory} />
        ) : view === 'weak-keys' ? (
          <WeakKeysPanel stats={data.weakKeys} history={data.history} onReset={handleResetWeakKeys} />
        ) : (
          <>
            {status !== 'finished' && (
              <section aria-label="Typing test settings" className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 sm:p-5">
                <div className="flex flex-col gap-4">
                  <ModePicker
                    mode={preferences.mode}
                    wordCount={preferences.wordCount}
                    duration={preferences.duration}
                    disabled={pickerDisabled}
                    onModeChange={handleModeChange}
                    onDurationChange={changeDuration}
                    onWordCountChange={changeWordCount}
                  />
                  {preferences.mode === 'time' && (
                    <div className="border-t border-slate-800 pt-3">
                      <CustomTextPicker
                        value={preferences.customText}
                        disabled={pickerDisabled}
                        onApply={changeCustomText}
                      />
                    </div>
                  )}
                  {preferences.mode !== 'code' && (
                    <div className="flex flex-col gap-2 border-t border-slate-800 pt-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Options</p>
                        <SettingsToggles
                          settings={preferences.settings}
                          disabled={pickerDisabled}
                          onChange={handleSettingsChange}
                        />
                      </div>
                      <span className="text-xs text-slate-400">
                        {preferences.settings.punctuation ? 'Punctuation on' : 'Punctuation off'} ·{' '}
                        {preferences.settings.numbers ? 'Numbers on' : 'Numbers off'}
                      </span>
                    </div>
                  )}
                </div>
              </section>
            )}

            {view === 'test' && (status === 'finished' && completedResult ? (
              <Results
                result={completedResult}
                best={derivePersonalBest(data.history, preferences)}
                storageAvailable={storageAvailable}
                onShare={openShare}
                onRestart={() => {
                  setCompletedResult(null)
                  restart()
                }}
              />
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-slate-400">
                    {preferences.mode === 'time'
                      ? `${preferences.customText.trim() ? 'Custom text test' : 'Timed test'} · ${preferences.duration} seconds`
                      : preferences.mode === 'words'
                        ? `Words test · ${preferences.wordCount} words`
                        : preferences.mode === 'code'
                          ? `Code test · ${preferences.duration} seconds · ${language ?? 'snippet'}`
                          : `Weak-key practice · ${preferences.wordCount} words`}
                    <span className="ml-2 text-slate-400">
                      {preferences.settings.punctuation ? 'punctuation on' : 'punctuation off'} ·{' '}
                      {preferences.settings.numbers ? 'numbers on' : 'numbers off'}
                    </span>
                  </p>
                  {preferences.mode !== 'code' && (
                    <p className="text-xs text-slate-400">Personal best: {personalBest} Net WPM</p>
                  )}
                </div>
                <StatsBar
                  timeValue={preferences.mode === 'time' || preferences.mode === 'code' ? Math.ceil(Math.max(0, preferences.duration - elapsed)) : elapsed.toFixed(1)}
                  timeLabel={preferences.mode === 'time' || preferences.mode === 'code' ? 'seconds left' : 'elapsed seconds'}
                  netWpm={stats.netWpm}
                  rawWpm={stats.rawWpm}
                  accuracy={stats.keystrokeAccuracy}
                  correctKeystrokes={stats.correctKeystrokes}
                  totalKeystrokes={stats.totalKeystrokes}
                />
                {preferences.mode === 'weak-keys' && usedWeakKeyFallback && (
                  <p role="status" className="rounded-lg border border-amber-900 bg-amber-950/40 p-3 text-sm text-amber-200">
                    Not enough reliable weak-key data yet; this prompt uses normal practice text.
                  </p>
                )}
                <TypingArea
                  text={text}
                  typed={typed}
                  finished={false}
                  codeMode={preferences.mode === 'code'}
                  focusVersion={focusVersion}
                  onChange={onType}
                  onRestart={restart}
                />
                <div className="flex flex-col gap-3 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
                  <p>
                    {status === 'idle'
                      ? 'Start typing to begin.'
                      : preferences.mode === 'time' || preferences.mode === 'code'
                        ? 'Keep going until the timer ends.'
                        : 'Type the complete prompt to finish.'}
                    {preferences.mode === 'code' && (
                      <span className="mt-1 block text-xs text-slate-400">
                        A new snippet appears after each one. Type indentation as shown; Enter inserts a newline. Tab restarts.
                      </span>
                    )}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={restart}
                      className="rounded-md border-2 border-slate-700/50 px-3 py-2 text-slate-200 hover:border-slate-500/50 hover:bg-slate-900"
                    >
                      Restart
                    </button>
                    <button
                      type="button"
                      onClick={newText}
                      className="rounded-md bg-slate-800 px-3 py-2 text-slate-200 hover:bg-slate-700"
                    >
                      New text
                    </button>
                  </div>
                </div>
              </>
            ))}
          </>
        )}
      </main>

      <footer className="mt-auto flex flex-wrap items-center justify-center gap-3 text-center text-sm text-slate-400">
        <span>TypeShyt</span>
        {!online && <span role="status" aria-live="polite" className="rounded-full border border-slate-700 px-3 py-1">Offline: your results are saved on this device</span>}
      </footer>
      {shareResult && <ShareDialog result={shareResult} triggerRef={shareTriggerRef} onClose={closeShare} />}
      <UpdateToast
        updateReady={pwaUpdates.updateReady}
        registrationError={pwaUpdates.registrationError}
        testRunning={status === 'running'}
        onReload={pwaUpdates.applyUpdate}
        onDismiss={pwaUpdates.dismissUpdate}
      />
    </div>
  )
}
