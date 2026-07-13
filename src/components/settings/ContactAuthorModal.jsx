import { createPortal } from 'react-dom'
import Icon from '../ui/Icon'

export default function ContactAuthorModal({ onClose }) {
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)', animation: 'fade-in 0.2s ease-out' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm overflow-hidden animate-slide-up"
        style={{
          backgroundColor: 'var(--bg)',
          borderRadius: '16px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--rule)' }}
        >
          <h2 className="text-[16px] font-semibold" style={{ color: 'var(--ink)' }}>联系作者</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ backgroundColor: 'var(--bg2)' }}
          >
            <Icon name="close" size={16} color="var(--ink)" />
          </button>
        </div>

        {/* 内容 */}
        <div className="px-5 py-5 space-y-5">
          {/* 作者信息 */}
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0"
              style={{ backgroundColor: '#7EC8E3', color: 'white' }}
            >
              R
            </div>
            <div>
              <p className="text-[15px] font-semibold" style={{ color: 'var(--ink)' }}>ralcer</p>
              <p className="text-[13px] mt-0.5" style={{ color: 'var(--muted)' }}>慧记开发者</p>
            </div>
          </div>

          {/* 邮箱 */}
          <div
            className="flex items-center gap-3 p-3 rounded-xl"
            style={{ backgroundColor: 'var(--bg2)' }}
          >
            <Icon name="mail" size={18} color="var(--muted)" />
            <div className="min-w-0">
              <p className="text-[12px]" style={{ color: 'var(--muted)' }}>邮箱</p>
              <p className="text-[14px] truncate" style={{ color: 'var(--ink)' }}>2487054344@qq.com</p>
            </div>
          </div>

          {/* 鼓励反馈 */}
          <div className="text-center py-2">
            <p className="text-[13px] leading-relaxed" style={{ color: 'var(--ink2)' }}>
              如果你在使用过程中遇到任何问题，或者有好的建议和想法，欢迎随时联系我 (◕ᴗ◕✿)
            </p>
            <p className="text-[13px] leading-relaxed mt-1" style={{ color: 'var(--ink2)' }}>
              你的每一条反馈都是慧记变得更好的动力
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
