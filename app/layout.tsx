import './globals.css'

export const metadata = {
  title: 'Cool Real Estate Tools',
  description: 'All Micro-App Demos',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}