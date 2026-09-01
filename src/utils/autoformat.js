const BLOCK_PATTERNS = {
  heading: /^#{1,6} .+$/,
  blockquote: /^> .+$/,
  ul: /^[-*+] .+$/,
  ol: /^\d+[.)] .+$/,
  hr: /^(\*{3,}|-{3,}|_{3,})$/,
  hrSpaced: /^(\*\s*){2,}\*$|^(-\s*){2,}-$|^(_\s*){2,}_$/,
  tableHeader: /^\|.*\|\s*$/,
  tableSeparator: /^\|[\s:|-]+\|\s*$/
}

export function isCompletedBlockPattern(text) {
  const t = text.trimEnd()
  if (BLOCK_PATTERNS.heading.test(t)) return 'heading'
  if (BLOCK_PATTERNS.blockquote.test(t)) return 'blockquote'
  if (BLOCK_PATTERNS.hr.test(t) || BLOCK_PATTERNS.hrSpaced.test(t)) return 'hr'
  if (BLOCK_PATTERNS.ul.test(t)) return 'ul'
  if (BLOCK_PATTERNS.ol.test(t)) return 'ol'
  if (isTableSeparator(t)) return 'table'
  return null
}

export function isTableHeader(text) {
  const t = text.trim()
  return BLOCK_PATTERNS.tableHeader.test(t) && !BLOCK_PATTERNS.hr.test(t) && !isTableSeparator(t)
}

export function isTableSeparator(text) {
  const t = text.trim()
  if (!BLOCK_PATTERNS.tableSeparator.test(t)) return false
  const h = t.match(/-+/g)
  return !!h && h.length >= 2
}

export function buildTableMarkdown(headerText, separatorText) {
  const cols = headerText.trim().split('|').length - 2
  if (cols < 1) return headerText.trim()
  const emptyRow = '| ' + Array(cols).fill('').join(' | ') + ' |'
  return [headerText.trim(), separatorText.trim(), emptyRow].join('\n')
}

export function isCompletedInlinePattern(text, caretOffset) {
  const len = text.length
  const before = text.slice(0, caretOffset)
  const after = text.slice(caretOffset, len)
  const endOk = caretOffset >= len || after.trim() === ''
  if (!endOk) return null
  const pairs = [
    { open: '**', close: '**', type: 'strong' },
    { open: '*', close: '*', type: 'em' },
    { open: '~~', close: '~~', type: 's' },
    { open: '`', close: '`', type: 'code' }
  ]
  for (const p of pairs) {
    if (before.endsWith(p.close)) {
      const content = findInner(before, p)
      if (content) return { type: p.type, content }
    }
  }
  return null
}

function findInner(before, p) {
  const idx = before.lastIndexOf(p.open, before.length - p.close.length - 1)
  if (idx === -1) return null
  const inner = before.slice(idx + p.open.length, before.length - p.close.length)
  if (inner.length === 0) return null
  return inner
}

export function resolveCaretOffset(oldText, caretOffset, newText) {
  if (!oldText) return 0
  const clamped = Math.max(0, Math.min(caretOffset, oldText.length))
  const keep = Math.min(clamped, newText.length)
  const stamp = oldText.slice(clamped, Math.min(clamped + 6, oldText.length)).toLowerCase()
  const rest = newText.toLowerCase()
  const at = rest.lastIndexOf(stamp)
  if (at !== -1) return Math.min(at, newText.length)
  return keep
}