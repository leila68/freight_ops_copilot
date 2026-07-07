import { useEffect, useState } from "react"
import { Save } from "lucide-react"

import { settingsApi } from "@/api/freight"


type Setting = {
  key: string
  value: string
  description?: string | null
}


function formatSettingName(key: string) {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char: string) =>
      char.toUpperCase()
    )
}

function SettingRow({
  setting,
  onSave,
}: {
  setting: Setting
  onSave: (key: string, value: string) => Promise<void>
}) {
  const [value, setValue] = useState(setting.value)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    try {
      setSaving(true)
      await onSave(setting.key, value)
    } finally {
      setSaving(false)
    }
  }


  const isPercentage = setting.key.includes("percent")


  return (
    <div className="rounded-lg border p-5 space-y-3">

      <div>
        <h3 className="font-semibold text-lg">
          {formatSettingName(setting.key)}
        </h3>

        {setting.description && (
          <p className="text-sm text-muted-foreground">
            {setting.description}
          </p>
        )}
      </div>


      <div className="flex items-center gap-3">

        <div className="flex items-center">

          <input
            className="border rounded-l-md px-3 py-2 w-32"
            type="number"
            value={value}
            onChange={(e) =>
              setValue(e.target.value)
            }
          />


          {isPercentage && (
            <span className="border border-l-0 rounded-r-md px-3 py-2 bg-muted">
              %
            </span>
          )}

        </div>


        <button
          className="flex items-center gap-2 rounded-md border px-4 py-2 hover:bg-muted disabled:opacity-50"
          onClick={handleSave}
          disabled={saving}
        >

          <Save size={16} />

          {saving ? "Saving..." : "Save"}

        </button>

      </div>

    </div>
  )
}



export function ManageSettings() {

  const [settings, setSettings] = useState<Setting[]>([])
  const [loading, setLoading] = useState(true)
  const [successMessage, setSuccessMessage] = useState("")


  useEffect(() => {
    loadSettings()
  }, [])


  async function loadSettings() {
    try {
      const data = await settingsApi.list()
      setSettings(data)
    } finally {
      setLoading(false)
    }
  }


  async function saveSetting(
    key: string,
    value: string
  ) {

    await settingsApi.update(
      key,
      { value }
    )


    setSuccessMessage(
      "Setting updated successfully."
    )


    setTimeout(() => {
      setSuccessMessage("")
    }, 3000)


    setSettings((prev) =>
      prev.map((setting) =>
        setting.key === key
          ? {
              ...setting,
              value,
            }
          : setting
      )
    )
  }



  if (loading) {
    return (
      <div>
        Loading settings...
      </div>
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



      {successMessage && (
        <div className="rounded-md border px-4 py-3 text-sm">
          ✓ {successMessage}
        </div>
      )}



      <div className="space-y-4">

        {settings.map((setting) => (
          <SettingRow
            key={setting.key}
            setting={setting}
            onSave={saveSetting}
          />
        ))}

      </div>


    </div>
  )
}