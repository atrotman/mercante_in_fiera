import { useEffect } from 'react'
import { useSocket } from '../contexts/SocketContext'

export function useSocketEvent<T>(event: string, handler: (data: T) => void) {
  const socket = useSocket()

  useEffect(() => {
    socket.on(event, handler)
    return () => {
      socket.off(event, handler)
    }
  }, [event, handler, socket])
} 