import { cn } from '@/lib/utils'

interface SpeechBubbleProps {
  message: string
  visible: boolean
}

export function SpeechBubble({ message, visible }: SpeechBubbleProps) {
  if (!visible || !message) return null

  return (
    <div
      className={cn(
        'absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-white px-2 py-1 text-[10px] text-gray-900 shadow-md',
        '[animation:bubble-in_0.4s_ease-out,bubble-out_0.3s_ease-in_3s_forwards]',
      )}
    >
      {message}
      <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-white" />
    </div>
  )
}
