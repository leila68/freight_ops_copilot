import { useState } from "react"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { PageHeader } from "@/components/PageHeader"
import { Card, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { Textarea } from "@/components/ui/Textarea"
import { Field } from "@/components/ui/Field"
import { Modal } from "@/components/ui/Modal"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table"
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/States"
import { useAsync } from "@/hooks/useAsync"
import { getErrorMessage } from "@/api/client"

// Field definition for the add/edit form.
export interface ResourceField<TForm> {
  key: keyof TForm
  label: string
  type?: "text" | "number" | "select"
  placeholder?: string
  required?: boolean
  step?: string
  textarea?: boolean
  options?: { label: string; value: string }[]
}

export interface ResourceColumn<T> {
  header: string
  render: (item: T) => React.ReactNode
  align?: "left" | "right"
}

interface ResourceManagerProps<T extends { id: string }, TForm> {
  title: string
  description: string
  singular: string // e.g. "lane"
  columns: ResourceColumn<T>[]
  fields: ResourceField<TForm>[]
  emptyForm: TForm
  toForm: (item: T) => TForm
  list: () => Promise<T[]>
  create: (payload: TForm) => Promise<T>
  update: (id: string, payload: TForm) => Promise<T>
  remove: (id: string) => Promise<void>
}

// Generic CRUD table + modal form used by the staff management pages
// (lanes, equipment types, accessorials).
export function ResourceManager<T extends { id: string }, TForm extends Record<string, unknown>>({
  title,
  description,
  singular,
  columns,
  fields,
  emptyForm,
  toForm,
  list,
  create,
  update,
  remove,
}: ResourceManagerProps<T, TForm>) {
  const resource = useAsync(list, [])

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<T | null>(null)
  const [form, setForm] = useState<TForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [deleteTarget, setDeleteTarget] = useState<T | null>(null)
  const [deleting, setDeleting] = useState(false)

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setFormError(null)
    setModalOpen(true)
  }

  const openEdit = (item: T) => {
    setEditing(item)
    setForm(toForm(item))
    setFormError(null)
    setModalOpen(true)
  }

  const setField = (key: keyof TForm, type?: ResourceField<TForm>["type"]) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const value = type === "number" ? Number(e.target.value) : e.target.value
    setForm((f) => ({ ...f, [key]: value }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setSaving(true)
    try {
      if (editing) {
        await update(editing.id, form)
      } else {
        await create(form)
      }
      setModalOpen(false)
      await resource.refetch()
    } catch (err) {
      setFormError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await remove(deleteTarget.id)
      setDeleteTarget(null)
      await resource.refetch()
    } catch (err) {
      // Surface error in the confirm modal via formError reuse.
      setFormError(getErrorMessage(err))
    } finally {
      setDeleting(false)
    }
  }

  const items = resource.data ?? []

  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add {singular}
          </Button>
        }
      />

      <Card>
        <CardContent>
          {resource.loading ? (
            <LoadingState label={`Loading ${title.toLowerCase()}...`} />
          ) : resource.error ? (
            <ErrorState
              message={resource.error}
              onRetry={() => resource.refetch().catch(() => {})}
            />
          ) : items.length === 0 ? (
            <EmptyState
              title={`No ${singular}s yet`}
              description={`Add your first ${singular} to get started.`}
            />
          ) : (
            <div className="rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((c) => (
                      <TableHead
                        key={c.header}
                        className={c.align === "right" ? "text-right" : ""}
                      >
                        {c.header}
                      </TableHead>
                    ))}
                    <TableHead className="w-px text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      {columns.map((c) => (
                        <TableCell
                          key={c.header}
                          className={c.align === "right" ? "text-right tabular-nums" : ""}
                        >
                          {c.render(item)}
                        </TableCell>
                      ))}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(item)}
                            aria-label={`Edit ${singular}`}
                            className="h-8 w-8"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setFormError(null)
                              setDeleteTarget(item)
                            }}
                            aria-label={`Delete ${singular}`}
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Edit ${singular}` : `Add ${singular}`}
      >
        <form id="resource-form" onSubmit={handleSave} className="flex flex-col gap-4">
          {fields.map((f) => (
            <Field
              key={String(f.key)}
              label={f.label}
              htmlFor={String(f.key)}
              required={f.required}
            >
              {f.type === "select" ? (
                <Select
                  id={String(f.key)}
                  options={f.options ?? []}
                  value={String(form[f.key] ?? "")}
                  onChange={setField(f.key, f.type)}
                  required={f.required}
                />
              ) : f.textarea ? (
                <Textarea
                  id={String(f.key)}
                  value={String(form[f.key] ?? "")}
                  onChange={setField(f.key, f.type)}
                  placeholder={f.placeholder}
                  required={f.required}
                />
              ) : (
                <Input
                  id={String(f.key)}
                  type={f.type ?? "text"}
                  step={f.type === "number" ? (f.step ?? "any") : undefined}
                  value={String(form[f.key] ?? "")}
                  onChange={setField(f.key, f.type)}
                  placeholder={f.placeholder}
                  required={f.required}
                />
              )}
            </Field>
          ))}
          {formError && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {formError}
            </div>
          )}
          <div className="mt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editing ? "Save changes" : `Create ${singular}`}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title={`Delete ${singular}?`}
        description="This action cannot be undone."
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" loading={deleting} onClick={handleDelete}>
              Delete
            </Button>
          </>
        }
      >
        {formError && (
          <div className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {formError}
          </div>
        )}
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete this {singular}?
        </p>
      </Modal>
    </div>
  )
}
