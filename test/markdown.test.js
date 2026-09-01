import { describe, it, expect } from 'vitest'
import { renderMarkdown } from '../src/utils/markdown'
import { htmlToMarkdown } from '../src/utils/html-to-markdown'

describe('headings', () => {
  it('renders H1 to H6', () => {
    expect(renderMarkdown('# One')).toContain('<h1>One</h1>')
    expect(renderMarkdown('## Two')).toContain('<h2>Two</h2>')
    expect(renderMarkdown('### Three')).toContain('<h3>Three</h3>')
    expect(renderMarkdown('#### Four')).toContain('<h4>Four</h4>')
    expect(renderMarkdown('##### Five')).toContain('<h5>Five</h5>')
    expect(renderMarkdown('###### Six')).toContain('<h6>Six</h6>')
  })

  it('supports underlined syntax with = and -', () => {
    expect(renderMarkdown('Title\n===')).toContain('<h1>Title</h1>')
    expect(renderMarkdown('Subtitle\n---')).toContain('<h2>Subtitle</h2>')
  })
})

describe('paragraphs and line breaks', () => {
  it('converts single line breaks into <br>', () => {
    expect(renderMarkdown('line 1\nline 2')).toContain('line 1<br>')
  })

  it('separates paragraphs with blank lines', () => {
    const html = renderMarkdown('paragraph one\n\nparagraph two')
    expect(html).toContain('<p>paragraph one</p>')
    expect(html).toContain('<p>paragraph two</p>')
  })
})

describe('blockquotes', () => {
  it('renders a simple blockquote', () => {
    expect(renderMarkdown('> quoted text')).toContain('<blockquote>')
    expect(renderMarkdown('> quoted text')).toContain('quoted text')
  })

  it('renders multi-paragraph blockquotes', () => {
    const html = renderMarkdown('> paragraph 1\n>\n> paragraph 2')
    expect(html).toContain('paragraph 1')
    expect(html).toContain('paragraph 2')
  })

  it('renders nested blockquotes', () => {
    const html = renderMarkdown('> main\n>\n> > nested')
    expect(html).toContain('nested')
    expect(html.match(/<blockquote>/g).length).toBeGreaterThanOrEqual(1)
  })
})

describe('lists', () => {
  it('renders unordered lists', () => {
    const html = renderMarkdown('- one\n- two\n- three')
    expect(html).toContain('<ul>')
    expect(html).toContain('<li>one</li>')
    expect(html).toContain('<li>three</li>')
  })

  it('supports *, - and + as markers', () => {
    expect(renderMarkdown('* a\n- b\n+ c')).toContain('<ul>')
  })

  it('renders ordered lists', () => {
    const html = renderMarkdown('1. first\n2. second')
    expect(html).toContain('<ol>')
    expect(html).toContain('<li>first</li>')
  })

  it('does not require sequential numbering', () => {
    const html = renderMarkdown('1. a\n3. b\n9. c')
    expect(html).toContain('<li>a</li>')
    expect(html).toContain('<li>c</li>')
  })

  it('renders nested lists', () => {
    const html = renderMarkdown('- parent\n    - child\n        - grandchild')
    expect(html).toContain('<li>parent')
    expect(html).toContain('<li>child')
    expect(html).toContain('<li>grandchild')
  })

  it('combines ordered and unordered lists', () => {
    const html = renderMarkdown('1. one\n    - a\n    - b')
    expect(html).toContain('<ol>')
    expect(html).toContain('<ul>')
  })
})

describe('block code', () => {
  it('renders blocks with three backticks', () => {
    const html = renderMarkdown('```\ncode here\n```')
    expect(html).toContain('<pre>')
    expect(html).toContain('<code>')
    expect(html).toContain('code here')
  })

  it('supports language in the block', () => {
    const html = renderMarkdown('```js\nconst x = 1\n```')
    expect(html).toContain('language-js')
  })

  it('supports tildes ~~~', () => {
    const html = renderMarkdown('~~~\ncode\n~~~')
    expect(html).toContain('<pre>')
  })

  it('supports a preformatted block with 4 spaces', () => {
    const html = renderMarkdown('    code line')
    expect(html).toContain('<pre>')
    expect(html).toContain('code line')
  })
})

describe('horizontal rules', () => {
  it.each(['***', '---', '___', '* * *', '- - -', '_ _ _'])('renders %s', (input) => {
    expect(renderMarkdown(input)).toContain('<hr>')
  })
})

describe('emphasis', () => {
  it('renders italics with * and _', () => {
    expect(renderMarkdown('*italic*')).toContain('<em>italic</em>')
    expect(renderMarkdown('_italic_')).toContain('<em>italic</em>')
  })

  it('renders bold with ** and __', () => {
    expect(renderMarkdown('**bold**')).toContain('<strong>bold</strong>')
    expect(renderMarkdown('__bold__')).toContain('<strong>bold</strong>')
  })

  it('combines italics and bold with ***', () => {
    expect(renderMarkdown('***both***')).toContain('<em><strong>both</strong></em>')
  })

  it('does not apply emphasis with underscores inside a word', () => {
    const html = renderMarkdown('foo_bar_baz')
    expect(html).not.toContain('<em>')
  })

  it('renders strikethrough with ~~', () => {
    expect(renderMarkdown('~~strikethrough~~')).toContain('<s>strikethrough</s>')
  })
})

describe('links', () => {
  it('renders inline links', () => {
    expect(renderMarkdown('[text](https://example.com)')).toContain('<a href="https://example.com">text</a>')
  })

  it('renders reference links', () => {
    const html = renderMarkdown('[text][ref]\n\n[ref]: https://example.com')
    expect(html).toContain('<a href="https://example.com">text</a>')
  })

  it('renders automatic links', () => {
    expect(renderMarkdown('<https://example.com>')).toContain('<a href="https://example.com">')
  })
})

describe('inline code', () => {
  it('renders inline code', () => {
    expect(renderMarkdown('`code`')).toContain('<code>code</code>')
  })
})

describe('images', () => {
  it('renders an inline image with alt', () => {
    expect(renderMarkdown('![alt](/path/img.jpg)')).toContain('<img src="/path/img.jpg" alt="alt">')
  })

  it('supports a title in the image', () => {
    expect(renderMarkdown('![alt](/img.jpg "title")')).toContain('title="title"')
  })

  it('renders an image by reference', () => {
    const html = renderMarkdown('![alt][img]\n\n[img]: /path/img.jpg')
    expect(html).toContain('<img src="/path/img.jpg" alt="alt">')
  })
})

describe('automatic links (linkify)', () => {
  it('converts bare URLs into links', () => {
    expect(renderMarkdown('https://example.com')).toContain('<a href="https://example.com">')
  })

  it('converts bare emails into links', () => {
    expect(renderMarkdown('mail@example.com')).toContain('<a href="mailto:')
  })
})

describe('character escaping', () => {
  it('renders an escaped asterisk literally', () => {
    const html = renderMarkdown('\\*not italic\\*')
    expect(html).not.toContain('<em>')
    expect(html).toContain('*not italic*')
  })

  it('renders an escaped hash literally', () => {
    const html = renderMarkdown('\\# not a heading')
    expect(html).not.toContain('<h1>')
    expect(html).toContain('# not a heading')
  })
})

describe('GFM tables', () => {
  it('renders a basic table', () => {
    const html = renderMarkdown('| A | B |\n|---|---|\n| 1 | 2 |')
    expect(html).toContain('<table>')
    expect(html).toContain('<th>A</th>')
    expect(html).toContain('<td>1</td>')
  })

  it('applies column alignment', () => {
    const html = renderMarkdown('| A | B |\n| :--- | ---: |\n| 1 | 2 |')
    expect(html).toContain('text-align:left')
    expect(html).toContain('text-align:right')
  })
})

describe('markdown table round-trip', () => {
  it('converts an HTML table back to GFM', () => {
    const html = '<table><thead><tr><th>A</th><th>B</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody></table>'
    const md = htmlToMarkdown(html)
    expect(md).toContain('| A | B |')
    expect(md).toContain('| --- | --- |')
    expect(md).toContain('| 1 | 2 |')
  })

  it('preserves links inside table cells', () => {
    const html = '<table><thead><tr><th>Name</th></tr></thead><tbody><tr><td><a href="https://example.com">site</a></td></tr></tbody></table>'
    const md = htmlToMarkdown(html)
    expect(md).toContain('[site](https://example.com)')
    expect(md).not.toContain('(url)')
  })

  it('normalizes rows with unequal column counts', () => {
    const html = '<table><thead><tr><th>A</th><th>B</th><th>C</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody></table>'
    const md = htmlToMarkdown(html)
    const header = md.split('\n')[0]
    expect(header.split('|').length - 2).toBe(3)
  })
})

describe('checkboxes', () => {
  it('renders unchecked tasks', () => {
    const html = renderMarkdown('- [ ] pending')
    expect(html).toContain('type="checkbox"')
    expect(html).toContain('pending')
  })

  it('renders checked tasks', () => {
    const html = renderMarkdown('- [x] done')
    expect(html).toContain('checked')
  })
})

describe('security', () => {
  it('escapes raw HTML (does not render it)', () => {
    const html = renderMarkdown('<script>alert("x")</script>')
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })
})