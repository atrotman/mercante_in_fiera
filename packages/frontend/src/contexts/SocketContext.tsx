import React, { createContext, useContext, ReactNode } from 'react'
import { SocketService } from '../services/socket'

const SocketContext = createContext<SocketService | null>(null)

interface SocketProviderProps {
  children: ReactNode
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const socketService = new SocketService()
  return (
    <SocketContext.Provider value={socketService}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
} 