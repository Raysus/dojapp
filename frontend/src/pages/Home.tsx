import { useEffect } from 'react'
import Login from './Login'
import Dashboard from './Dashboard'
import { useAuth } from '../auth/AuthContext'

export default function Home() {
  const { user, loading } = useAuth()

  useEffect(() => { }, [loading])

  if (loading) return null

  return user ? <Dashboard /> : <Login />
}
