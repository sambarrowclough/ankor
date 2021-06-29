import { io } from 'socket.io-client'

export const socket = io(
  'https://linear-webhook-websocket-server.sambarrowclough.repl.co'
)

socket.displayName = 'socket'
