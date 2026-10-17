
'use client'

import { useState } from 'react'

export default function BackendTestPage() {
  const [result, setResult] = useState('Not tested yet')
  const [loading, setLoading] = useState(false)

  async function testBackend() {
    setLoading(true)
    setResult('Connecting to Flask...')

    try {
      const response = await fetch('http://127.0.0.1:5000/api/health')
      const data = await response.json()

      if (!response.ok) {
        throw new Error('Backend returned an error')
      }

      setResult(data.message)
    } catch {
      setResult('Connection failed. Check that Flask is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ padding: 40, fontFamily: 'Arial, sans-serif' }}>
      <h1>CivicFix AI — Backend Test</h1>
      <p>Testing the connection between Next.js and Flask.</p>

      <button
        onClick={testBackend}
        disabled={loading}
        style={{ padding: '12px 20px', cursor: 'pointer' }}
      >
        {loading ? 'Connecting...' : 'Test Backend Connection'}
      </button>

      <p style={{ marginTop: 20 }}>Result: {result}</p>
    </main>
  )
}
