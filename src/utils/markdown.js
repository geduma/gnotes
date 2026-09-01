import MarkdownIt from 'markdown-it'
import taskLists from 'markdown-it-task-lists'

const md = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true
})
  .use(taskLists)

export function renderMarkdown(src) {
  return md.render(src || '')
}
