import { Outlet } from 'react-router-dom'
import Header from './Header'

export default function Layout() {
  return (
    <div className="appShell">
      <Header />
      <main className="appMain">
        <Outlet />
      </main>
    </div>
  )
}
