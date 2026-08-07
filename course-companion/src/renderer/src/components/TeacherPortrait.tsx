type TeacherPortraitProps = {
  compact?: boolean
}

export function TeacherPortrait({ compact = false }: TeacherPortraitProps) {
  return (
    <svg
      className={compact ? 'teacher-portrait teacher-portrait--compact' : 'teacher-portrait'}
      viewBox="0 0 120 132"
      role="img"
      aria-label="Hương, giáo viên đồng hành"
    >
      <path className="portrait-shadow" d="M20 126c5-25 19-38 40-38s35 13 40 38H20Z" />
      <path className="portrait-cardigan" d="M25 125c3-25 15-37 35-37s32 12 35 37H25Z" />
      <path className="portrait-shirt" d="m47 91 13 19 13-19c-4-3-8-4-13-4s-9 1-13 4Z" />
      <path className="portrait-neck" d="M51 80h18v17H51z" />
      <ellipse className="portrait-face" cx="60" cy="55" rx="29" ry="34" />
      <path className="portrait-hair" d="M31 54c0-25 12-40 31-40 20 0 30 16 29 42-4-5-7-12-8-21-9 8-24 13-44 13-1 9-3 16-7 21-1-5-1-10-1-15Z" />
      <path className="portrait-hair portrait-hair--side" d="M82 38c7 10 9 27 4 42 9-8 13-20 10-34-2-10-7-18-15-23l1 15Z" />
      <circle className="portrait-eye" cx="49" cy="58" r="2.5" />
      <circle className="portrait-eye" cx="71" cy="58" r="2.5" />
      <path className="portrait-smile" d="M53 70c4 4 10 4 14 0" />
      <circle className="portrait-pin" cx="82" cy="105" r="4" />
    </svg>
  )
}
