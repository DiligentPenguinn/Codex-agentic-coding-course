import { useEffect, useState, type CSSProperties } from 'react'
import type { RuntimeInfo } from '../../../../shared/contracts'
import roomImage from '../../../../../prototypes/mvp-3-course-experience-companion/assets/home-base.png'
import teacherImage from '../../../../../prototypes/mvp-3-course-experience-companion/assets/teacher.png'

type LessonStage = 'opening' | 'bad-consequence' | 'concept' | 'brief-choice' | 'weak-brief' | 'success'

type EvidenceItem = {
  label: string
  value: string
  ready?: boolean
}

type Choice = {
  label: string
  next?: LessonStage
  primary?: boolean
  danger?: boolean
  action?: 'practice'
}

type SceneContent = {
  step: number
  objective: string
  panelLabel: string
  panelStatus: string
  tone: 'neutral' | 'bad' | 'good'
  request: string
  evidence: EvidenceItem[]
  dialogue: string
  choices: Choice[]
}

const scenes: Record<LessonStage, SceneContent> = {
  opening: {
    step: 1,
    objective: 'Nhận ra rủi ro của một yêu cầu mơ hồ',
    panelLabel: 'YÊU CẦU TỪ NGƯỜI DÙNG',
    panelStatus: 'CHƯA GỬI',
    tone: 'neutral',
    request: '“Làm phần giới thiệu đẹp hơn.”',
    evidence: [
      { label: 'MỤC TIÊU', value: 'Chưa rõ' },
      { label: 'PHẠM VI', value: 'Chưa giới hạn' },
      { label: 'BẰNG CHỨNG', value: 'Chưa có' }
    ],
    dialogue: 'Bạn vừa nhận một yêu cầu: “Làm phần giới thiệu đẹp hơn.” Nếu gửi ngay cho Codex, điều gì có thể xảy ra?',
    choices: [
      { label: 'Codex sẽ tự hiểu đúng ý', next: 'bad-consequence', danger: true },
      { label: 'Kết quả sẽ khó đoán và khó kiểm tra', next: 'concept', primary: true }
    ]
  },
  'bad-consequence': {
    step: 1,
    objective: 'Nhận ra rủi ro của một yêu cầu mơ hồ',
    panelLabel: 'KẾT QUẢ GIẢ ĐỊNH',
    panelStatus: 'KHÓ KIỂM CHỨNG',
    tone: 'bad',
    request: 'Codex thay bố cục, màu sắc và năm tệp—nhưng không biết thay đổi nào thực sự giải quyết vấn đề.',
    evidence: [
      { label: 'TỆP THAY ĐỔI', value: '5 tệp' },
      { label: 'LÝ DO', value: 'Không rõ' },
      { label: 'DONE-WHEN', value: 'Không có' }
    ],
    dialogue: 'Codex có thể làm rất nhiều, nhưng bạn không có tiêu chuẩn để biết kết quả có đúng hay không. Hãy làm rõ yêu cầu trước khi gửi.',
    choices: [{ label: 'Làm rõ yêu cầu', next: 'concept', primary: true }]
  },
  concept: {
    step: 2,
    objective: 'Tìm ba phần giúp yêu cầu có thể kiểm chứng',
    panelLabel: 'BA Ô CÒN THIẾU',
    panelStatus: '0/3 SẴN SÀNG',
    tone: 'neutral',
    request: 'Một yêu cầu an toàn cần nói rõ thay đổi gì, được phép chạm vào đâu và bằng chứng nào xác nhận đã xong.',
    evidence: [
      { label: 'MỤC TIÊU', value: 'Thay đổi gì?' },
      { label: 'PHẠM VI', value: 'Được sửa đâu?' },
      { label: 'BẰNG CHỨNG', value: 'Xong khi nào?' }
    ],
    dialogue: 'Ba phần cần có là mục tiêu, phạm vi và bằng chứng. Bây giờ hãy chọn yêu cầu mà bạn có thể kiểm tra sau khi Codex hoàn thành.',
    choices: [{ label: 'Chọn một yêu cầu', next: 'brief-choice', primary: true }]
  },
  'brief-choice': {
    step: 3,
    objective: 'Chọn yêu cầu có giới hạn và bằng chứng rõ ràng',
    panelLabel: 'BA Ô CẦN KIỂM TRA',
    panelStatus: 'CHỌN MỘT YÊU CẦU',
    tone: 'neutral',
    request: 'Bạn sẽ gửi yêu cầu nào cho Codex?',
    evidence: [
      { label: 'MỤC TIÊU', value: 'Cụ thể?' },
      { label: 'PHẠM VI', value: 'Giới hạn?' },
      { label: 'BẰNG CHỨNG', value: 'Đo được?' }
    ],
    dialogue: 'Bạn sẽ gửi yêu cầu nào cho Codex?',
    choices: [
      { label: 'A · Làm giao diện đẹp và hiện đại hơn', next: 'weak-brief', danger: true },
      { label: 'B · Tự quyết định mọi thứ cần sửa', next: 'weak-brief', danger: true },
      {
        label: 'C · Nút chính rộng 100% ở 390px; chỉ sửa CSS; không tràn ngang',
        next: 'success',
        primary: true
      }
    ]
  },
  'weak-brief': {
    step: 3,
    objective: 'Chọn yêu cầu có giới hạn và bằng chứng rõ ràng',
    panelLabel: 'YÊU CẦU VẪN CÒN MƠ HỒ',
    panelStatus: '1/3 SẴN SÀNG',
    tone: 'bad',
    request: 'Có ý định thay đổi, nhưng phạm vi và bằng chứng vẫn do Codex tự đoán.',
    evidence: [
      { label: 'MỤC TIÊU', value: 'Còn chủ quan' },
      { label: 'PHẠM VI', value: 'Không giới hạn' },
      { label: 'BẰNG CHỨNG', value: 'Không đo được' }
    ],
    dialogue: '“Đẹp” và “mọi thứ cần sửa” không tạo ra một điểm kiểm tra. Hãy chọn lại một yêu cầu có giới hạn rõ ràng.',
    choices: [{ label: 'Chọn lại', next: 'brief-choice', primary: true }]
  },
  success: {
    step: 4,
    objective: 'Mang yêu cầu đã kiểm chứng sang Codex',
    panelLabel: 'YÊU CẦU ĐÃ SẴN SÀNG',
    panelStatus: '3/3 SẴN SÀNG',
    tone: 'good',
    request: '“Ở 390px, làm nút chính rộng 100%. Chỉ sửa CSS của onboarding. Xong khi không có tràn ngang.”',
    evidence: [
      { label: 'MỤC TIÊU', value: 'Nút dễ chạm', ready: true },
      { label: 'PHẠM VI', value: 'Một tệp CSS', ready: true },
      { label: 'BẰNG CHỨNG', value: '390px, không tràn', ready: true }
    ],
    dialogue: 'Tốt. Bạn đã làm rõ điều gì được phép thay đổi và cách kiểm chứng kết quả. Bây giờ có thể chuyển sang thực hành trong Codex.',
    choices: [
      { label: 'Xem lại từ đầu', next: 'opening' },
      { label: 'Thu nhỏ để thực hành', action: 'practice', primary: true }
    ]
  }
}

function EvidenceGrid({ items }: { items: EvidenceItem[] }) {
  return (
    <div className="pixel-evidence-grid">
      {items.map((item) => (
        <div className={item.ready ? 'is-ready' : ''} key={item.label}>
          <small>{item.label}</small>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  )
}

export function LearningWindow() {
  const [runtime, setRuntime] = useState<RuntimeInfo | null>(null)
  const [stage, setStage] = useState<LessonStage>('opening')
  const scene = scenes[stage]

  useEffect(() => {
    void window.courseCompanion?.getRuntimeInfo().then(setRuntime)
  }, [])

  const minimizeToTeacher = async () => {
    await window.courseCompanion?.setCompanionMode('compact')
    await window.courseCompanion?.hideLearningWindow()
  }

  const choose = (choice: Choice) => {
    if (choice.action === 'practice') {
      void minimizeToTeacher()
      return
    }

    if (choice.next) setStage(choice.next)
  }

  const sceneStyle = {
    '--pixel-room-image': `url("${roomImage}")`
  } as CSSProperties

  return (
    <main className="pixel-learning-shell">
      <div className="pixel-scene-world" style={sceneStyle} aria-hidden="true" />

      <header className="pixel-hud">
        <div className="pixel-brand">
          <span className="pixel-brand__mark" aria-hidden="true">C</span>
          <span>
            <strong>CONTENT BUILDER ACADEMY</strong>
            <small>PIXEL MISSION STUDIO</small>
          </span>
        </div>

        <div className="pixel-mission-meta" aria-label={`Bước ${scene.step} trên 4`}>
          <span>NHIỆM VỤ 01 · BƯỚC {scene.step}/4</span>
          <strong>Viết yêu cầu để Codex có thể kiểm chứng</strong>
          <div className="pixel-progress" aria-hidden="true">
            <i style={{ width: `${scene.step * 25}%` }} />
          </div>
        </div>

        <button
          className="pixel-quit"
          type="button"
          onClick={() => void window.courseCompanion?.quitApp()}
        >
          THOÁT · v{runtime?.appVersion ?? '…'}
        </button>
      </header>

      <section className="pixel-scene-title">
        <small>BÀI HỌC CHÍNH</small>
        <strong>{scene.objective}</strong>
      </section>

      <img className="pixel-teacher-character" src={teacherImage} alt="Hương, giáo viên đồng hành" />

      <aside className="pixel-consequence" data-tone={scene.tone} aria-live="polite">
        <header>
          <span>{scene.panelLabel}</span>
          <strong>{scene.panelStatus}</strong>
        </header>
        <div className="pixel-request"><p>{scene.request}</p></div>
        <EvidenceGrid items={scene.evidence} />
      </aside>

      <section className="pixel-dialogue" aria-labelledby="teacherName">
        <div className="pixel-speaker">
          <img src={teacherImage} alt="" />
          <span>TEACHER</span>
          <strong id="teacherName">Hương</strong>
        </div>
        <p>{scene.dialogue}</p>
        <div className="pixel-choices">
          {scene.choices.map((choice) => (
            <button
              className={`pixel-choice${choice.primary ? ' is-primary' : ''}${choice.danger ? ' is-danger' : ''}`}
              key={choice.label}
              type="button"
              onClick={() => choose(choice)}
            >
              {choice.label}
            </button>
          ))}
        </div>
      </section>
    </main>
  )
}
