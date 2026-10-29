import { useEffect, useState } from 'react'

export function PracticeReviewElapsed() {
  const [startedAt] = useState(Date.now)
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSeconds(Math.floor((Date.now() - startedAt) / 1000))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [startedAt])

  return <span className="practice-review-elapsed" role="timer" aria-label="Thời gian kiểm tra" aria-live="off">{seconds} giây</span>
}
