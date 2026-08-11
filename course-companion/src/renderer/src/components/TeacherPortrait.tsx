import teacherImage from '../assets/teacher-triet.png'

type TeacherPortraitProps = {
  compact?: boolean
}

export function TeacherPortrait({ compact = false }: TeacherPortraitProps) {
  return (
    <img
      className={compact ? 'teacher-portrait teacher-portrait--compact' : 'teacher-portrait'}
      src={teacherImage}
      alt="Triết, giáo viên đồng hành"
    />
  )
}
