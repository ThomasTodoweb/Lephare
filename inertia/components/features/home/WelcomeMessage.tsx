import { Heading } from '~/components/ui'

interface WelcomeMessageProps {
  firstName: string
}

export function WelcomeMessage({ firstName }: WelcomeMessageProps) {
  return (
    <Heading level={2}>
      Bienvenue {firstName}
    </Heading>
  )
}
