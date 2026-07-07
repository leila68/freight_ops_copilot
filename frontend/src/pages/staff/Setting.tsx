import { useEffect, useState } from "react"
import { settingsApi } from "@/api/freight"

type Setting = {
  key: string
  value: string
  description?: string
}

export function ManageSettings() {
  const [settings, setSettings] = useState<Setting[]>([])

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    const data = await settingsApi.list()
    setSettings(data)
  }

  async function save(
    key: string,
    value: string
  ) {
    await settingsApi.update(key, { value })

    setSettings((prev) =>
      prev.map((item) =>
        item.key === key
          ? { ...item, value }
          : item
      )
    )
  }

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-2xl font-bold">
          Quote Settings
        </h1>

        <p className="text-muted-foreground">
          Manage pricing configuration used by quote calculations.
        </p>
      </div>


      <div className="space-y-4">

        {settings.map((setting) => (
          <SettingRow
            key={setting.key}
            setting={setting}
            onSave={save}
          />
        ))}

      </div>

    </div>
  )
}


function SettingRow({
  setting,
  onSave,
}: {
  setting: Setting
  onSave: (
    key: string,
    value: string
  ) => void
}) {

  const [value, setValue] = useState(setting.value)

  return (
    <div className="border rounded-lg p-4">

      <div className="font-medium">
        {setting.key}
      </div>

      <div className="text-sm text-muted-foreground">
        {setting.description}
      </div>


      <div className="flex gap-2 mt-3">

        <input
          className="border rounded px-3 py-2"
          value={value}
          onChange={(e) =>
            setValue(e.target.value)
          }
        />

        <button
          className="border rounded px-4"
          onClick={() =>
            onSave(setting.key, value)
          }
        >
          Save
        </button>

      </div>

    </div>
  )
}