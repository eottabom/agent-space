import { useState, useEffect, useCallback } from 'react'
import { FolderOpen, Folder, ChevronUp, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { fetchDirectories, type DirectoryListing } from '@/lib/api'

interface FolderPickerProps {
  value: string
  onChange: (path: string) => void
  placeholder?: string
  className?: string
  inputClassName?: string
  'data-testid'?: string
}

export function FolderPicker({
  value,
  onChange,
  placeholder,
  className,
  inputClassName,
  'data-testid': testId,
}: FolderPickerProps) {
  const [open, setOpen] = useState(false)
  const [browsePath, setBrowsePath] = useState('')
  const [listing, setListing] = useState<DirectoryListing | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadDirectory = useCallback(async (dirPath?: string) => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchDirectories(dirPath)
      setListing(result)
      setBrowsePath(result.current)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      loadDirectory(value || undefined)
    }
  }, [open, loadDirectory, value])

  const handleOpen = () => setOpen(true)

  const handleSelect = () => {
    onChange(browsePath)
    setOpen(false)
  }

  const handleNavigate = (dirPath: string) => {
    loadDirectory(dirPath)
  }

  const isRoot = listing ? listing.current === listing.parent : false

  return (
    <div className={`flex items-center gap-1.5 ${className ?? ''}`}>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputClassName}
        data-testid={testId}
      />
      <button
        type="button"
        onClick={handleOpen}
        className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-md bg-[#1a2535] border border-[#2a3a4a] text-gray-400 hover:text-gray-200 hover:bg-[#253545] transition-colors"
        data-testid={testId ? `${testId}-browse` : undefined}
      >
        <FolderOpen className="w-4 h-4" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[60]">
          <div className="fixed inset-0 bg-black/80" onClick={() => setOpen(false)} />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <div className="relative z-50 w-full max-w-md rounded-lg border bg-[#0d1520] border-[#1e2a3a] p-6 shadow-lg">
              <button
                onClick={() => setOpen(false)}
                className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100"
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>

              <h2 className="text-sm font-semibold text-gray-200">Browse Directory</h2>

              <div className="mt-3 space-y-3">
                {/* Current path + parent button */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0 px-2 py-1.5 rounded bg-[#1a2535] border border-[#2a3a4a]">
                    <p className="text-xs text-gray-400 truncate" title={browsePath}>
                      {browsePath}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isRoot || loading}
                    onClick={() => listing && handleNavigate(listing.parent)}
                    className="h-8 px-2 border-[#2a3a4a] text-gray-400 hover:bg-[#1a2535] disabled:opacity-30"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </Button>
                </div>

                {/* Directory listing */}
                <ScrollArea className="max-h-[300px] rounded border border-[#1e2a3a] bg-[#0a1018]">
                  {loading && (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />
                    </div>
                  )}

                  {error && (
                    <div className="px-3 py-4 text-center">
                      <p className="text-xs text-rose-400">{error}</p>
                    </div>
                  )}

                  {!loading && !error && listing && listing.directories.length === 0 && (
                    <div className="px-3 py-8 text-center">
                      <p className="text-xs text-gray-600">No subdirectories</p>
                    </div>
                  )}

                  {!loading && !error && listing && listing.directories.map((dir) => (
                    <button
                      key={dir.path}
                      type="button"
                      onClick={() => handleNavigate(dir.path)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[#1a2535] transition-colors border-b border-[#1e2a3a] last:border-b-0"
                    >
                      <Folder className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      <span className="text-xs text-gray-300 truncate">{dir.name}</span>
                    </button>
                  ))}
                </ScrollArea>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setOpen(false)}
                    className="border-[#2a3a4a] text-gray-400 hover:bg-[#1a2535]"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSelect}
                    disabled={!browsePath}
                    className="bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Select
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
