import { ReactNode } from 'react'
import { PageLoader } from './ui/PageLoader'

interface AppWrapperProps {
  children: ReactNode
}

export function AppWrapper({ children }: AppWrapperProps) {
  return (
    <>
      <PageLoader />
      {children}
    </>
  )
}
