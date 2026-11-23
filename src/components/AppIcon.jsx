import React from 'react'

// Small, decorative line icons: labels remain the accessible names of controls.
export default function AppIcon({ name, size = 20, className }) {
  const paths = {
    language: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.4 2.4 3.5 5.4 3.5 9s-1.1 6.6-3.5 9c-2.4-2.4-3.5-5.4-3.5-9S9.6 5.4 12 3Z"/></>,
    location: <><path d="M12 21s-6.5-5.4-6.5-10.5a6.5 6.5 0 1 1 13 0C18.5 15.6 12 21 12 21Z"/><circle cx="12" cy="10.5" r="2.3"/></>,
    bell: <><path d="M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8M10 20a2 2 0 0 0 4 0"/></>,
    sound: <><path d="M4 10v4h3l4 3V7l-4 3H4ZM15 9a4 4 0 0 1 0 6M17.5 6a8 8 0 0 1 0 12"/></>,
    appearance: <><circle cx="12" cy="12" r="9"/><path d="M12 3v18a9 9 0 0 0 0-18Z" fill="currentColor" stroke="none"/></>,
    beads: <><circle cx="12" cy="4" r="1.25"/><circle cx="7.4" cy="6.2" r="1.25"/><circle cx="5.2" cy="10.5" r="1.25"/><circle cx="6.2" cy="15.1" r="1.25"/><circle cx="10.1" cy="18" r="1.25"/><circle cx="14.9" cy="17.6" r="1.25"/><circle cx="18" cy="14" r="1.25"/><circle cx="18.5" cy="9.4" r="1.25"/><circle cx="16" cy="5.6" r="1.25"/><path d="m10 19 2 3 2-3"/></>,
    list: <><path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4" cy="6" r=".8" fill="currentColor"/><circle cx="4" cy="12" r=".8" fill="currentColor"/><circle cx="4" cy="18" r=".8" fill="currentColor"/></>,
    book: <><path d="M12 6.5C9.8 5 6.5 4.7 3 5.5v12c3.5-.8 6.8-.5 9 1 2.2-1.5 5.5-1.8 9-1v-12c-3.5-.8-6.8-.5-9 1ZM12 6.5v12"/></>,
    sliders: <><path d="M4 6h16M4 12h16M4 18h16"/><circle cx="8" cy="6" r="2" fill="var(--card-solid)"/><circle cx="16" cy="12" r="2" fill="var(--card-solid)"/><circle cx="9" cy="18" r="2" fill="var(--card-solid)"/></>,
  }
  if (!paths[name]) return null
  return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{paths[name]}</svg>
}
