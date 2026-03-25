'use client'

import { useRef } from 'react'
import { FileText, Download, Upload, Paperclip } from 'lucide-react'
import { formatDate, formatFileSize } from '@/lib/utils'

export interface AttachmentItem {
  id: number | string
  fileName: string
  fileSize?: number | null
  mimeType?: string | null
  url?: string | null
  uploadedAt?: string | Date | null
  uploadedBy?: string | null
  description?: string | null
}

interface AttachmentPanelProps {
  attachments: AttachmentItem[]
  onUpload?: (files: FileList) => void
  accept?: string
  title?: string
  readonly?: boolean
}

export function AttachmentPanel({
  attachments,
  onUpload,
  accept,
  title = 'Documents',
  readonly = false,
}: AttachmentPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && onUpload) {
      onUpload(e.target.files)
      e.target.value = ''
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
          <Paperclip size={14} className="text-slate-400" />
          {title}
          {attachments.length > 0 && (
            <span className="text-xs text-slate-400">({attachments.length})</span>
          )}
        </h4>
        {!readonly && onUpload && (
          <>
            <button
              type="button"
              onClick={handleUploadClick}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-slate-300 text-slate-600 bg-white hover:bg-slate-50 transition-colors"
            >
              <Upload size={12} />
              Upload
            </button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept={accept}
              multiple
              onChange={handleFileChange}
              aria-hidden="true"
            />
          </>
        )}
      </div>

      {!attachments || attachments.length === 0 ? (
        <div className="text-sm text-slate-500 py-6 text-center border border-dashed border-slate-200 rounded-lg">
          No documents attached.
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
          {attachments.map((doc) => (
            <li key={doc.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex-shrink-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-100">
                  <FileText size={16} className="text-slate-500" />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {doc.fileName}
                </p>
                <p className="text-xs text-slate-500">
                  {doc.fileSize ? formatFileSize(doc.fileSize) : ''}
                  {doc.uploadedAt ? ` · Uploaded ${formatDate(doc.uploadedAt)}` : ''}
                </p>
                {doc.description && (
                  <p className="text-xs text-slate-500 mt-0.5">{doc.description}</p>
                )}
              </div>
              {doc.url && (
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label="Download or view document"
                >
                  <Download size={16} />
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
