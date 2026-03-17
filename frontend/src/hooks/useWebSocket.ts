import { useCallback, useEffect, useRef, useState } from 'react'
import type { WsMessage } from '@/types/websocket'

type MessageHandler = (msg: WsMessage) => void

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null)
  const handlersRef = useRef<Set<MessageHandler>>(new Set())
  const [connected, setConnected] = useState(false)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const reconnectDelayRef = useRef(1000)
  const pendingRef = useRef<string[]>([])

  useEffect(() => {
    let isUnmounted = false

    const connect = () => {
      if (isUnmounted) return

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const host = window.location.host
      const websocket = new WebSocket(`${protocol}//${host}/ws`)
      wsRef.current = websocket

      websocket.onopen = () => {
        if (wsRef.current !== websocket) return
        setConnected(true)
        reconnectDelayRef.current = 1000

        const pendingMessages = pendingRef.current.splice(0)
        for (const pendingMessage of pendingMessages) {
          try {
            websocket.send(pendingMessage)
          } catch {
            // ignore transient send errors during reconnect
          }
        }
      }

      websocket.onclose = () => {
        if (wsRef.current !== websocket) return
        setConnected(false)
        wsRef.current = null

        if (isUnmounted) return

        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectDelayRef.current = Math.min(reconnectDelayRef.current * 2, 30000)
          connect()
        }, reconnectDelayRef.current)
      }

      websocket.onerror = () => {
        websocket.close()
      }

      websocket.onmessage = (event) => {
        if (wsRef.current !== websocket) return
        try {
          const message: WsMessage = JSON.parse(event.data)
          handlersRef.current.forEach((handler) => {
            try {
              handler(message)
            } catch (error) {
              console.error('WS handler error:', error)
            }
          })
        } catch (error) {
          console.error('WS parse error:', error)
        }
      }
    }

    connect()

    return () => {
      isUnmounted = true
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
      const ws = wsRef.current
      wsRef.current = null
      ws?.close()
    }
  }, [])

  const send = useCallback((message: WsMessage) => {
    const json = JSON.stringify(message)
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(json)
    } else {
      // Queue messages to be sent when connected
      pendingRef.current.push(json)
    }
  }, [])

  const addHandler = useCallback((handler: MessageHandler) => {
    handlersRef.current.add(handler)
    return () => { handlersRef.current.delete(handler) }
  }, [])

  return { send, addHandler, connected }
}
