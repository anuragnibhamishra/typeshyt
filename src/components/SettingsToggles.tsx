import type { TestSettings } from '../utils/storage'

interface Props {
  settings: TestSettings
  disabled: boolean
  onChange: (settings: TestSettings) => void
}

export default function SettingsToggles({ settings, disabled, onChange }: Props) {
  return (
    <fieldset disabled={disabled} className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-300">
      <legend className="sr-only">Options</legend>
      {(['punctuation', 'numbers'] as const).map((setting) => (
        <label key={setting} className="inline-flex cursor-pointer items-center gap-2 rounded-md py-1 disabled:cursor-not-allowed">
          <input
            type="checkbox"
            checked={settings[setting]}
            onChange={(event) => onChange({ ...settings, [setting]: event.target.checked })}
            className="peer sr-only"
          />
          <span
            aria-hidden="true"
            className="grid h-4 w-4 place-items-center rounded border border-slate-600 bg-slate-950 transition-colors peer-checked:border-brand-400 peer-checked:bg-brand-500 peer-checked:[&>svg]:opacity-100 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-400 peer-disabled:opacity-50"
          >
            <svg className="h-3 w-3 text-slate-950 opacity-0" viewBox="0 0 16 16" fill="none">
              <path d="m3 8 3.2 3.2L13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          {setting === 'punctuation' ? 'Punctuation' : 'Numbers'}
        </label>
      ))}
    </fieldset>
  )
}
