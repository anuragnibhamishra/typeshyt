import type { TestSettings } from '../utils/storage'

interface Props {
  settings: TestSettings
  disabled: boolean
  onChange: (settings: TestSettings) => void
}

export default function SettingsToggles({ settings, disabled, onChange }: Props) {
  return (
    <fieldset disabled={disabled} className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-300">
      <legend className="sr-only">Text settings</legend>
      {(['punctuation', 'numbers'] as const).map((setting) => (
        <label key={setting} className="inline-flex cursor-pointer items-center gap-2 disabled:cursor-not-allowed">
          <input
            type="checkbox"
            checked={settings[setting]}
            onChange={(event) => onChange({ ...settings, [setting]: event.target.checked })}
            className="h-4 w-4 accent-emerald-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400"
          />
          {setting === 'punctuation' ? 'Punctuation' : 'Numbers'}
        </label>
      ))}
    </fieldset>
  )
}
