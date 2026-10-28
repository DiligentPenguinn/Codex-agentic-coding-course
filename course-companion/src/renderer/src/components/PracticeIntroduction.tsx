import type { ReactNode } from 'react'
import type { Introduction } from './practice-introduction-copy'

export function PracticeIntroduction({
  introduction,
  children,
  showReference
}: {
  introduction: Introduction
  children: ReactNode
  showReference: boolean
}) {
  return (
    <>
      <h1 id="practiceObjective">{introduction.title}</h1>
      <p className="practice-setup-purpose">{introduction.purpose}</p>
      <p className="practice-setup-definition">{introduction.context}</p>
      <ol className="practice-setup-instructions" aria-label="Cách thực hành">
        {introduction.steps.map((step) => <li key={step}>{step}</li>)}
      </ol>
      {children}
      {showReference ? (
        <details className="practice-setup-reference">
          <summary>{introduction.referenceTitle}</summary>
          {introduction.referenceNote ? <p>{introduction.referenceNote}</p> : null}
          <dl>
            {introduction.reference.map(([label, value, explanation]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd><strong>{value}</strong><span>{explanation}</span></dd>
              </div>
            ))}
          </dl>
        </details>
      ) : null}
    </>
  )
}
