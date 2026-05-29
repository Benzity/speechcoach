import { useLocation } from 'react-router-dom'
import Header from '../auth/Header'

// 자체 nav/hero가 있는 페이지(랜딩)와 인증 페이지에서는 글로벌 Header 숨김
const NO_HEADER_ROUTES = ['/', '/login', '/signup']

export default function Layout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation()
  const hideHeader = NO_HEADER_ROUTES.includes(pathname)
  return (
    <>
      {!hideHeader && <Header />}
      {children}
    </>
  )
}
