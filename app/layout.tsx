import './globals.css'

export const metadata = {
  title: 'Cool Real Estate Tools',
  description: 'All Micro-App Demos',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Bungee&family=Inter:wght@400;700;900&family=Playfair+Display:ital,wght@1,900&family=Righteous&family=Syne:wght@800&family=VT323&display=swap" rel="stylesheet" />
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}