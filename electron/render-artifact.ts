import { marked } from 'marked'
import type { Artifact, ArtifactComponent } from '@/lib/artifacts'

const cell = (text: string) => text.replace(/\|/g, '\\|').replace(/\n/g, ' ')

function viewToMarkdown(node: ArtifactComponent): string {
  switch (node.type) {
    case 'layout':
      return node.components.map(viewToMarkdown).filter(Boolean).join('\n\n')
    case 'card':
      return `**${node.title}**\n\n${viewToMarkdown(node.content)}`
    case 'typography': {
      const prefix = { H1: '# ', H2: '## ', H3: '### ', P: '' }[node.size ?? 'P']
      return `${prefix}${node.content}`
    }
    case 'badge':
      return `\`${node.text}\``
    case 'alert':
      return `> ${node.title ? `**${node.title}** ` : ''}${node.body.replace(/\n/g, '\n> ')}`
    case 'table':
      return [
        `| ${node.columns.map(cell).join(' | ')} |`,
        `| ${node.columns.map(() => '---').join(' | ')} |`,
        ...node.rows.map(row => `| ${node.columns.map((_, i) => cell(row[i] ?? '')).join(' | ')} |`),
      ].join('\n')
    case 'separator':
      return '---'
    case 'kbd':
      return `\`${node.keys}\``
    case 'progress':
      return `${Math.round(node.value)}%`
    case 'metric':
      return `**${node.label}:** ${node.value}${node.caption ? ` (${node.caption})` : ''}${node.badge ? ` \`${node.badge.text}\`` : ''}`
  }
}

/** An artifact as a subject and a Markdown body, the shape every channel sends. */
export function artifactMessage(artifact: Artifact): { subject: string; markdown: string } {
  const { content } = artifact
  return content.kind === 'message'
    ? { subject: content.subject, markdown: content.body }
    : { subject: artifact.title, markdown: viewToMarkdown(content.view) }
}

/** Markdown for Slack and Google Chat, which use their own markup. */
export function toChatMarkup(markdown: string): string {
  const lines: string[] = []
  let inTable = false
  for (const line of markdown.split('\n')) {
    const tableRow = /^\s*\|.*\|\s*$/.test(line)
    // Neither renders tables: show them as preformatted text.
    if (tableRow !== inTable) lines.push('```')
    inTable = tableRow
    if (tableRow) {
      if (!/^\s*\|[\s|:-]+\|\s*$/.test(line)) lines.push(line)
      continue
    }
    lines.push(
      line
        .replace(/^#{1,6}\s+(.+)$/, '**$1**')
        .replace(/^(\s*)[-*]\s+/, '$1• ')
        .replace(/\*\*(.+?)\*\*/g, '\u0000$1\u0000')
        .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1_$2_')
        .replace(/\u0000(.+?)\u0000/g, '*$1*')
        .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<$2|$1>'),
    )
  }
  if (inTable) lines.push('```')
  return lines.join('\n')
}

const escapeHtml = (text: string) =>
  text.replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`)

// Raw HTML the model wrote shows as text, never as markup.
marked.use({ renderer: { html: ({ text }) => escapeHtml(text) } })

/** An e-mail's HTML body. */
export function toEmailHtml(subject: string, markdown: string): string {
  const body = marked.parse(markdown, { async: false })
  return `<!doctype html><html><body style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;font-size:14px;line-height:1.5;color:#111;max-width:720px">
<h2 style="font-size:18px">${escapeHtml(subject)}</h2>
${body}
<p style="color:#888;font-size:12px;margin-top:24px">Sent by Agent Desktop</p>
<style>table{border-collapse:collapse}td,th{border:1px solid #ddd;padding:4px 8px;text-align:left}</style>
</body></html>`
}
