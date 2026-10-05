// ms_api hardcodes port 2024; LISTEN_PORT moves it without touching the source.
import net from 'node:net'
const to = Number(process.env.LISTEN_PORT)
const listen = net.Server.prototype.listen
net.Server.prototype.listen = function (...args) {
  if (args[0]?.port === 2024) args[0] = { ...args[0], port: to }
  else if (args[0] === 2024) args[0] = to
  return listen.apply(this, args)
}
