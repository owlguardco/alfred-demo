import './globals.css'

export const metadata = {
  title: 'Alfred',
  description: 'Demo co-pilot',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}
