import { useEffect, useRef, useCallback } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import type { WsMessage } from '@/types/websocket'
import { MessageTypes } from '@/types/websocket'

interface UseTerminalOptions {
  sessionId: string
  connected: boolean
  send: (msg: WsMessage) => void
  addHandler: (handler: (msg: WsMessage) => void) => () => void
  onOutput?: () => void
}

export function useTerminal({ sessionId, connected, send, addHandler, onOutput }: UseTerminalOptions) {
  const terminalRef = useRef<HTMLDivElement | null>(null)
  const xtermRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const connectedRef = useRef(connected)

  useEffect(() => {
    connectedRef.current = connected
  }, [connected])

  const fit = useCallback(() => {
    if (fitAddonRef.current) {
      try {
        fitAddonRef.current.fit()
        const dimensions = fitAddonRef.current.proposeDimensions()
        if (dimensions) {
          send({
            type: MessageTypes.SESSION_RESIZE,
            sessionId,
            cols: dimensions.cols,
            rows: dimensions.rows,
          })
        }
      } catch {
        // ignore fit errors during init
      }
    }
  }, [sessionId, send])

  const sendReconnect = useCallback(() => {
    send({
      type: MessageTypes.SESSION_RECONNECT,
      sessionId,
    })
  }, [sessionId, send])

  // Create terminal once
  useEffect(() => {
    if (!terminalRef.current) return

    const term = new Terminal({
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Menlo, Monaco, monospace",
      fontSize: 13,
      lineHeight: 1.2,
      cursorBlink: true,
      cursorStyle: 'bar',
      theme: {
        background: '#0c1421',
        foreground: '#c9d1d9',
        cursor: '#c9d1d9',
        selectionBackground: '#264f7880',
        black: '#0c1421',
        red: '#ff7b72',
        green: '#7ee787',
        yellow: '#d29922',
        blue: '#79c0ff',
        magenta: '#d2a8ff',
        cyan: '#56d4dd',
        white: '#c9d1d9',
        brightBlack: '#484f58',
        brightRed: '#ffa198',
        brightGreen: '#aff5b4',
        brightYellow: '#e3b341',
        brightBlue: '#a5d6ff',
        brightMagenta: '#e2c5ff',
        brightCyan: '#a5f3fc',
        brightWhite: '#f0f6fc',
      },
      allowProposedApi: true,
      scrollback: 10000,
    })

    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)
    term.open(terminalRef.current)

    xtermRef.current = term
    fitAddonRef.current = fitAddon

    requestAnimationFrame(() => fit())

    // User input -> backend
    const termResponseRe = /^\x1b\[[\?>]?[\d;]*[cnR]$/
    const inputDisposable = term.onData((dataChunk) => {
      if (termResponseRe.test(dataChunk)) return
      const encoded = btoa(
        new Uint8Array(new TextEncoder().encode(dataChunk))
          .reduce((acc, byte) => acc + String.fromCharCode(byte), '')
      )
      send({
        type: MessageTypes.SESSION_INPUT,
        sessionId,
        data: encoded,
      })
    })

    const binaryDisposable = term.onBinary((binaryData) => {
      const encoded = btoa(binaryData)
      send({
        type: MessageTypes.SESSION_INPUT,
        sessionId,
        data: encoded,
      })
    })

    // Backend output -> terminal
    const removeHandler = addHandler((message: WsMessage) => {
      if (message.sessionId !== sessionId) return

      if (message.type === MessageTypes.SESSION_OUTPUT || message.type === MessageTypes.SESSION_HISTORY) {
        if (message.data && typeof message.data === 'string') {
          const binary = atob(message.data)
          const bytes = new Uint8Array(binary.length)
          for (let index = 0; index < binary.length; index++) {
            bytes[index] = binary.charCodeAt(index)
          }
          term.write(bytes)
          // 커서 이동, 상태바 등 소량 출력은 무시
          if (message.type === MessageTypes.SESSION_OUTPUT && bytes.length > 512) {
            onOutput?.()
          }
        }
      }
    })

    // Send reconnect immediately if already connected
    if (connectedRef.current) {
      sendReconnect()
    }

    const resizeObserver = new ResizeObserver(() => fit())
    resizeObserver.observe(terminalRef.current)

    return () => {
      inputDisposable.dispose()
      binaryDisposable.dispose()
      removeHandler()
      resizeObserver.disconnect()
      term.dispose()
      xtermRef.current = null
      fitAddonRef.current = null
    }
  }, [sessionId, send, addHandler, fit, sendReconnect, onOutput])

  // Re-send reconnect when WebSocket (re)connects
  useEffect(() => {
    if (connected && xtermRef.current) {
      sendReconnect()
    }
  }, [connected, sendReconnect])

  return { terminalRef, fit }
}
