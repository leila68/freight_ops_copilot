import { useState, useRef } from "react"
import { Upload, Trash2, FileText, Loader2 } from "lucide-react"
import { PageHeader } from "@/components/PageHeader"
import { Card, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Field } from "@/components/ui/Field"
import { Modal } from "@/components/ui/Modal"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table"
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/States"
import { useAsync } from "@/hooks/useAsync"
import { api, getErrorMessage } from "@/api/client"
import type { Document } from "@/types"

// Format bytes to human-readable
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", {
    year: "numeric", month: "short", day: "numeric",
  })
}

async function fetchDocuments(): Promise<Document[]> {
  const { data } = await api.get<Document[]>("/documents")
  return data
}

export function ManageDocuments() {
  const resource = useAsync(fetchDocuments, [])

  const [uploadOpen, setUploadOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [deleteTarget, setDeleteTarget] = useState<Document | null>(null)
  const [deleting, setDeleting] = useState(false)

  const openUpload = () => {
    setTitle("")
    setFile(null)
    setUploadError(null)
    setUploadOpen(true)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null
    setFile(f)
    if (f && !title) {
      // Auto-fill title from filename
      setTitle(f.name.replace(/\.pdf$/i, "").replace(/[-_]/g, " "))
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return
    setUploadError(null)
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("title", title)
      const response = await api.post("/documents", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      alert(
        `Document uploaded successfully. ${response.data.chunk_count} chunks created.`
      )
      setUploadOpen(false)
      await resource.refetch()
    } catch (err) {
      setUploadError(getErrorMessage(err))
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.delete(`/documents/${deleteTarget.id}`)
      setDeleteTarget(null)
      await resource.refetch()
    } catch (err) {
      console.error(err)
    } finally {
      setDeleting(false)
    }
  }

  const docs = resource.data ?? []

  return (
    <div>
      <PageHeader
        title="Documents"
        description="Upload policy documents, carrier contracts, and rate guides for AI-powered Q&A."
        actions={
          <Button onClick={openUpload}>
            <Upload className="h-4 w-4" />
            Upload document
          </Button>
        }
      />

      <Card>
        <CardContent>
          {resource.loading ? (
            <LoadingState label="Loading documents..." />
          ) : resource.error ? (
            <ErrorState message={resource.error} onRetry={() => resource.refetch().catch(() => { })} />
          ) : docs.length === 0 ? (
            <EmptyState
              title="No documents yet"
              description="Upload a PDF to enable AI-powered document Q&A."
            />
          ) : (
            <div className="rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Filename</TableHead>
                    <TableHead className="text-right">Size</TableHead>
                    <TableHead className="text-right">Chunks</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead className="w-px text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {docs.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          {doc.title}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{doc.filename}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatBytes(doc.file_size)}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {doc.chunk_count === 0 ? (
                          <span className="flex items-center justify-end gap-1 text-muted-foreground">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Processing
                          </span>
                        ) : (
                          doc.chunk_count
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(doc.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteTarget(doc)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload modal */}
      <Modal open={uploadOpen} onClose={() => setUploadOpen(false)} title="Upload document">
        <form onSubmit={handleUpload} className="flex flex-col gap-4">
          <Field label="Document title" htmlFor="title" required>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Carrier Rate Policy 2026"
              required
            />
          </Field>

          <Field label="PDF file" htmlFor="file" required>
            <div
              className="flex cursor-pointer flex-col items-center gap-2 rounded-md border-2 border-dashed border-border p-6 text-center hover:border-primary hover:bg-muted/30 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-8 w-8 text-muted-foreground" />
              {file ? (
                <div>
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium">Click to select a PDF</p>
                  <p className="text-xs text-muted-foreground">Maximum 10MB</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                id="file"
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handleFileChange}
                required
              />
            </div>
          </Field>

          {uploadError && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {uploadError}
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            After upload, the document will be processed and chunked automatically.
            The chunk count will update once processing is complete.
          </p>

          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setUploadOpen(false)}>Cancel</Button>
            <Button type="submit" loading={uploading} disabled={!file}>
              <Upload className="h-4 w-4" />
              Upload
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation */}
      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete document?"
        description="This will permanently delete the document and all its embeddings."
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" loading={deleting} onClick={handleDelete}>Delete</Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete <span className="font-medium">{deleteTarget?.title}</span>?
          The AI will no longer be able to answer questions from this document.
        </p>
      </Modal>
    </div>
  )
}