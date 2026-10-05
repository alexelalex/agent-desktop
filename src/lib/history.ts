import type { UIMessage } from 'ai'

export function downloadChat(chat: {
  id: string
  title: string
  messages: UIMessage[]
}) {
  const blob = new Blob([JSON.stringify(chat, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const name = chat.title.replace(/[^\w]+/g, '-').replace(/^-|-$/g, '') || 'chat'
  Object.assign(document.createElement('a'), {
    href: url,
    download: `${name}.json`,
  }).click()
  setTimeout(() => URL.revokeObjectURL(url))
}
