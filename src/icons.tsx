import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement>
const base = (p: P) => ({
  width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
  strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true, ...p,
})

export const IHome = (p: P) => <svg {...base(p)}><path d="M3 11.5 12 4l9 7.5" /><path d="M5.5 10v9.5h13V10" /></svg>
export const IPractise = (p: P) => <svg {...base(p)}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4A2.5 2.5 0 0 1 4 13.5z" /></svg>
export const IProgress = (p: P) => <svg {...base(p)}><path d="M4 19c3-1 4-6 7-6s3 3 5 3 3-5 4-9" /></svg>
export const IMic = (p: P) => <svg {...base(p)}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" /></svg>
export const IType = (p: P) => <svg {...base(p)}><path d="M4 20h16M6 16 15.5 6.5a2.1 2.1 0 0 1 3 3L9 19H6z" /></svg>
export const IArrow = (p: P) => <svg {...base(p)}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
export const IBack = (p: P) => <svg {...base(p)}><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
export const IClose = (p: P) => <svg {...base(p)}><path d="M6 6l12 12M18 6 6 18" /></svg>
export const IStop = (p: P) => <svg {...base(p)}><rect x="6.5" y="6.5" width="11" height="11" rx="2" fill="currentColor" stroke="none" /></svg>
export const IPause = (p: P) => <svg {...base(p)}><path d="M9 6v12M15 6v12" /></svg>
export const IPlay = (p: P) => <svg {...base(p)}><path d="M7 5v14l12-7z" fill="currentColor" /></svg>
export const IRedo = (p: P) => <svg {...base(p)}><path d="M4 12a8 8 0 1 0 2.5-5.8M4 4v4h4" /></svg>
export const ILock = (p: P) => <svg {...base(p)}><rect x="5" y="10.5" width="14" height="10" rx="2.5" /><path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3" /></svg>
export const ISpark = (p: P) => <svg {...base(p)}><path d="M12 3c.6 4.2 2.8 6.4 7 7-4.2.6-6.4 2.8-7 7-.6-4.2-2.8-6.4-7-7 4.2-.6 6.4-2.8 7-7z" /></svg>
export const ICheck = (p: P) => <svg {...base(p)}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
export const IFlag = (p: P) => <svg {...base(p)}><path d="M5 21V4M5 4h11l-2 4 2 4H5" /></svg>
export const ITrash = (p: P) => <svg {...base(p)}><path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13" /></svg>
export const IUser = (p: P) => <svg {...base(p)}><circle cx="12" cy="8.5" r="4" /><path d="M4.5 20.5c1.2-3.8 4-5.5 7.5-5.5s6.3 1.7 7.5 5.5" /></svg>
export const IPin = (p: P) => <svg {...base(p)}><path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z" /><circle cx="12" cy="10" r="2.3" /></svg>

/** Hand-drawn underline scribble, the brand's signature mark. */
export const Scribble = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 220 18" preserveAspectRatio="none" aria-hidden>
    <path d="M3 12c30-7 62-9 96-7s68 4 118-4" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
  </svg>
)
