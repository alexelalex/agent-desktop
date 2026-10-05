// A minimal SMTP server that accepts every message and logs it (notification tests).
import net from 'node:net'
import { appendFileSync, mkdirSync } from 'node:fs'
mkdirSync(new URL('./.out/', import.meta.url), { recursive: true })
const LOG = new URL('./.out/smtp.log', import.meta.url)
net.createServer(socket => {
  let inData = false, buffer = '', mail = { from: '', to: [], data: '' }
  socket.write('220 sink ESMTP\r\n')
  socket.on('data', chunk => {
    buffer += chunk
    let i
    while ((i = buffer.indexOf('\r\n')) >= 0) {
      const line = buffer.slice(0, i)
      buffer = buffer.slice(i + 2)
      if (inData) {
        if (line === '.') {
          inData = false
          appendFileSync(LOG, JSON.stringify(mail) + '\n')
          mail = { from: '', to: [], data: '' }
          socket.write('250 OK\r\n')
        } else mail.data += line + '\n'
        continue
      }
      const cmd = line.slice(0, 4).toUpperCase()
      if (cmd === 'EHLO') socket.write('250-sink\r\n250 SIZE 10000000\r\n')
      else if (cmd === 'HELO') socket.write('250 sink\r\n')
      else if (cmd === 'MAIL') { mail.from = line; socket.write('250 OK\r\n') }
      else if (cmd === 'RCPT') { mail.to.push(line); socket.write('250 OK\r\n') }
      else if (cmd === 'DATA') { inData = true; socket.write('354 go\r\n') }
      else if (cmd === 'QUIT') { socket.write('221 bye\r\n'); socket.end() }
      else socket.write('250 OK\r\n')
    }
  })
}).listen(2525, () => console.log('smtp sink on :2525'))
