interface Props {
  updateReady: boolean
  registrationError: boolean
  testRunning: boolean
  onReload: () => void
  onDismiss: () => void
}

export default function UpdateToast({
  updateReady,
  registrationError,
  testRunning,
  onReload,
  onDismiss,
}: Props) {
  if (!updateReady && !registrationError) return null

  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-3 z-40 mx-auto flex max-w-xl justify-end sm:inset-x-auto sm:right-5">
      <aside
        role="status"
        aria-live="polite"
        className="pointer-events-auto flex w-full flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-700 bg-slate-900 p-4 shadow-xl"
      >
        <p className="text-sm text-slate-100">
          {registrationError ? 'Offline support could not be registered.' : 'New version available'}
        </p>
        {updateReady && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onReload}
              disabled={testRunning}
              className="rounded-md bg-brand-500 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {testRunning ? 'Finish test to reload' : 'Reload'}
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="rounded-md border border-slate-600 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
            >
              Dismiss
            </button>
          </div>
        )}
      </aside>
    </div>
  )
}
