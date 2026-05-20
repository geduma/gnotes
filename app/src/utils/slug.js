export function generateSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function generateUniqueSlug(title, existingSlugs) {
  const baseSlug = generateSlug(title)
  let slug = baseSlug
  let counter = 0

  while (existingSlugs.includes(slug)) {
    counter++
    slug = `${baseSlug}-${counter}`
  }

  return slug
}
