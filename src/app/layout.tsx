import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MAHE Admission Portal | Online Manipal',
  description: 'Apply for admission to Manipal Academy of Higher Education (MAHE) programs through the Online Manipal portal.',
}

import { ApplicationProvider } from '@/components/ApplicationProvider'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ApplicationProvider>
          {children}
        </ApplicationProvider>
      </body>
    </html>
  )
}
