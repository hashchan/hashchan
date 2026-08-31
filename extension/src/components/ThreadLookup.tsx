import { useState } from 'react'
import { parseHashchanThreadUrl, type HashchanThreadTarget } from '../utils/hashchanUrl'

const φ = Math.PHI

export const ThreadLookup = ({ onLookup }: { onLookup: (target: HashchanThreadTarget) => void }) => {
  const [value, setValue] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const target = parseHashchanThreadUrl(value)
    if (!target) {
      setError('Not a recognized hashchan thread link.')
      return
    }
    setError('')
    setValue('')
    onLookup(target)
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: `${1 / φ ** 2}em`,
        padding: `${1 / φ ** 2}em`,
        marginBottom: `${1 / φ}em`,
        border: '1px solid #20C20E20',
      }}
    >
      <span style={{ fontSize: `${1 / φ}em`, color: '#fff' }}>
        Have a hashchan thread link? Paste it to pull that thread up directly.
      </span>
      <div style={{ display: 'flex', gap: `${1 / φ ** 2}em` }}>
        <input
          type="text"
          value={value}
          onChange={(e) => { setValue(e.target.value); if (error) setError('') }}
          placeholder="https://.../chains/1/boards/1/threads/0x...?atBlock=..."
          style={{ flex: 1, margin: 0, fontSize: `${1 / φ}em` }}
        />
        <button type="submit" style={{ margin: 0 }}>Go</button>
      </div>
      {error && <span style={{ color: '#ff4444', fontSize: `${1 / φ}em` }}>{error}</span>}
    </form>
  )
}
