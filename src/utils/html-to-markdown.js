import TurndownService from 'turndown'

const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
  strongDelimiter: '**',
  bulletListMarker: '-'
})

turndown.addRule('strikethrough', {
  filter: ['s', 'del'],
  replacement: function (content) {
    return '~~' + content + '~~'
  }
})

turndown.addRule('taskListCheckbox', {
  filter: node => node.nodeName === 'INPUT' && node.getAttribute('type') === 'checkbox',
  replacement: function (content, node) {
    return node.checked ? '[x] ' : '[ ] '
  }
})

turndown.addRule('table', {
  filter: node => node.nodeName === 'TABLE',
  replacement: function (content, node) {
    const rows = []
    for (let i = 0; i < node.children.length; i++) {
      const tr = node.children[i]
      if (tr.nodeName === 'THEAD' || tr.nodeName === 'TBODY') {
        for (let j = 0; j < tr.children.length; j++) {
          if (tr.children[j].nodeName === 'TR') rows.push(cellsToRow(tr.children[j]))
        }
      } else if (tr.nodeName === 'TR') {
        rows.push(cellsToRow(tr))
      }
    }
    if (!rows.length) return ''
    let width = 0
    for (const r of rows) width = Math.max(width, r.length)
    if (!width) return ''
    const padRow = (row) => {
      const padded = row.slice(0, width)
      while (padded.length < width) padded.push({ text: '', align: '---' })
      return padded
    }
    const header = padRow(rows[0])
    let output = '| ' + header.map((c) => c.text).join(' | ') + ' |\n'
    output += '| ' + header.map((c) => c.align).join(' | ') + ' |\n'
    for (let i = 1; i < rows.length; i++) {
      output += '| ' + padRow(rows[i]).map((c) => c.text).join(' | ') + ' |\n'
    }
    return output.trim() + '\n\n'
  }
})

function cellsToRow(tr) {
  const cells = []
  for (let i = 0; i < tr.children.length; i++) {
    const cell = tr.children[i]
    const align = cell.align || ''
    const alignDelimiter = align === 'left' ? ':---' : align === 'right' ? '---:' : align === 'center' ? ':---:' : '---'
    cells.push({
      text: inlineToMarkdown(cell.innerHTML),
      align: alignDelimiter
    })
  }
  return cells
}

function inlineToMarkdown(html) {
  if (!html) return ''
  return html
    .replace(/<strong>/g, '**')
    .replace(/<\/strong>/g, '**')
    .replace(/<em>/g, '*')
    .replace(/<\/em>/g, '*')
    .replace(/<code>/g, '`')
    .replace(/<\/code>/g, '`')
    .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/g, '[$2]($1)')
    .replace(/<a[^>]*>(.*?)<\/a>/g, '[$1]()')
    .replace(/<[^>]+>/g, '')
}

export function htmlToMarkdown(html) {
  return turndown.turndown(html || '')
}