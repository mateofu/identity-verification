import { useEffect, useState } from 'react'

export function useObjectUrl(file: File): string | null {
  const [objectUrl, setObjectUrl] = useState<string | null>(null)

  useEffect(() => {
    const nextObjectUrl = URL.createObjectURL(file)
    setObjectUrl(nextObjectUrl)

    return () => URL.revokeObjectURL(nextObjectUrl)
  }, [file])

  return objectUrl
}
