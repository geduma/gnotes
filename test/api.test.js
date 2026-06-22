import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFetch = vi.fn()

vi.stubGlobal('fetch', mockFetch)

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0'

function mockAuthResponse() {
  mockFetch.mockResolvedValueOnce({
    json: () => Promise.resolve({ ok: true, msg: 'Success', data: { token: TOKEN } })
  })
}

import { fetchNotes, createNote, updateNote, deleteNote } from '../src/utils/api'

function lastUrl() {
  return mockFetch.mock.calls[1][0]
}

describe('fetchNotes', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  it('fetches all notes without query', async () => {
    mockAuthResponse()
    const notes = [{ slug: 'test', title: 'Test', body: '', tags: [], updated: '2026-06-22' }]
    mockFetch.mockResolvedValueOnce({
      status: 200,
      json: () => Promise.resolve({ ok: true, msg: 'Success', data: notes })
    })

    const result = await fetchNotes()
    expect(result).toEqual(notes)
    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(lastUrl()).toMatch(/\/gnotes$/)
  })

  it('fetches with query parameter', async () => {
    mockAuthResponse()
    mockFetch.mockResolvedValueOnce({
      status: 200,
      json: () => Promise.resolve({ ok: true, msg: 'Success', data: [] })
    })

    await fetchNotes('test query')
    expect(lastUrl()).toMatch(/\/gnotes\?q=test%20query$/)
  })

  it('returns empty array on 204', async () => {
    mockAuthResponse()
    mockFetch.mockResolvedValueOnce({ status: 204 })

    const result = await fetchNotes()
    expect(result).toEqual([])
  })

  it('throws on error response', async () => {
    mockAuthResponse()
    mockFetch.mockResolvedValueOnce({
      status: 500,
      json: () => Promise.resolve({ ok: false, msg: 'Server error', data: [] })
    })

    await expect(fetchNotes()).rejects.toThrow('Server error')
  })
})

describe('createNote', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  it('creates a note successfully', async () => {
    mockAuthResponse()
    mockFetch.mockResolvedValueOnce({
      status: 201,
      json: () => Promise.resolve({ ok: true, msg: 'Success', data: { success: true, slug: 'new-note' } })
    })

    const result = await createNote({ slug: 'new-note', title: 'New Note', body: '', tags: [], updated: '2026-06-22' })
    expect(result).toEqual({ success: true, slug: 'new-note' })

    const postCall = mockFetch.mock.calls[1]
    expect(postCall[0]).toMatch(/\/gnotes$/)
    expect(postCall[1].method).toBe('POST')
    expect(JSON.parse(postCall[1].body)).toEqual({ slug: 'new-note', title: 'New Note', body: '', tags: [], updated: '2026-06-22' })
  })

  it('throws on duplicate slug (409)', async () => {
    mockAuthResponse()
    mockFetch.mockResolvedValueOnce({
      status: 409,
      json: () => Promise.resolve({ ok: false, msg: 'Slug already exists', data: [] })
    })

    await expect(createNote({ slug: 'existing', title: 'Existing', body: '', tags: [], updated: '2026-06-22' })).rejects.toThrow('Slug already exists')
  })
})

describe('updateNote', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  it('updates a note successfully', async () => {
    mockAuthResponse()
    mockFetch.mockResolvedValueOnce({
      status: 200,
      json: () => Promise.resolve({ ok: true, msg: 'Success', data: { success: true, slug: 'updated-note' } })
    })

    const result = await updateNote('my-note', { title: 'Updated', body: 'content', tags: [], updated: '2026-06-22' })
    expect(result).toEqual({ success: true, slug: 'updated-note' })

    const putCall = mockFetch.mock.calls[1]
    expect(putCall[0]).toMatch(/\/gnotes\/my-note$/)
    expect(putCall[1].method).toBe('PUT')
  })

  it('renames slug via newSlug', async () => {
    mockAuthResponse()
    mockFetch.mockResolvedValueOnce({
      status: 200,
      json: () => Promise.resolve({ ok: true, msg: 'Success', data: { success: true, slug: 'new-title' } })
    })

    const result = await updateNote('old-title', { title: 'New Title', body: '', tags: [], updated: '2026-06-22', newSlug: 'new-title' })
    expect(result.slug).toBe('new-title')

    const putBody = JSON.parse(mockFetch.mock.calls[1][1].body)
    expect(putBody.newSlug).toBe('new-title')
  })

  it('throws on 404', async () => {
    mockAuthResponse()
    mockFetch.mockResolvedValueOnce({
      status: 404,
      json: () => Promise.resolve({ ok: false, msg: 'Note not found', data: [] })
    })

    await expect(updateNote('nonexistent', { title: 'Nope' })).rejects.toThrow('Note not found')
  })
})

describe('deleteNote', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  it('deletes a note successfully', async () => {
    mockAuthResponse()
    mockFetch.mockResolvedValueOnce({
      status: 200,
      json: () => Promise.resolve({ ok: true, msg: 'Success', data: { success: true } })
    })

    const result = await deleteNote('my-note')
    expect(result).toEqual({ success: true })

    const deleteCall = mockFetch.mock.calls[1]
    expect(deleteCall[0]).toMatch(/\/gnotes\/my-note$/)
    expect(deleteCall[1].method).toBe('DELETE')
  })

  it('throws on error', async () => {
    mockAuthResponse()
    mockFetch.mockResolvedValueOnce({
      status: 500,
      json: () => Promise.resolve({ ok: false, msg: 'Internal error', data: [] })
    })

    await expect(deleteNote('my-note')).rejects.toThrow('Internal error')
  })
})
