export interface DirectoryEntry {
  name: string
  path: string
}

export interface DirectoryListing {
  current: string
  parent: string
  directories: DirectoryEntry[]
}

export async function fetchDirectories(dirPath?: string): Promise<DirectoryListing> {
  const params = dirPath ? `?path=${encodeURIComponent(dirPath)}` : ''
  const response = await fetch(`/api/directories${params}`)
  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(body.error || `HTTP ${response.status}`)
  }
  return response.json()
}
