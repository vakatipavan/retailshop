import './globals.css';
import { ReactNode } from 'react';

export const metadata = {
  title: 'Retail Shop Management',
  description: 'A modern billing and inventory management application',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
