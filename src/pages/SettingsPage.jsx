import { useState } from 'react'
import ThemeSwitcher from '../components/ThemeSwitcher'
import Icon from '../components/ui/Icon'
import ProfileSettingsPanel from '../components/settings/ProfileSettingsPanel'
import AISettingsPanel from '../components/settings/AISettingsPanel'
import XiaohuiSettingsPanel from '../components/settings/XiaohuiSettingsPanel'
import PrivacySettingsPanel from '../components/settings/PrivacySettingsPanel'
import ReminderSettingsPanel from '../components/settings/ReminderSettingsPanel'
import ToolbarSettings from '../components/settings/ToolbarSettings'
import DataManagementModal from '../components/settings/DataManagementModal'
import AboutModal from '../components/settings/AboutModal'
import ContactAuthorModal from '../components/settings/ContactAuthorModal'
import { exportAllData } from '../db/database'
import { recordBackupDate } from '../utils/reminder'
import { saveOrShareFile } from '../utils/fileHelper'
import { CURRENT_VERSION, forceCheckUpdate } from '../utils/updateChecker'
import { isMobileDevice } from '../utils/device'

function UpdateModal({ latest, hasUpdate = true, onDismiss }) {
  if (!latest) return null
  // 根据设备类型选择直链：手机端下载 APK，桌面端下载 EXE
  const isMobile = isMobileDevice()
  const downloadUrl = (isMobile
    ? latest.assets?.find(a => a.name.endsWith('.apk'))?.url
    : latest.assets?.find(a => a.name.endsWith('.exe'))?.url
  ) || latest.htmlUrl
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)', animation: 'fade-in 0.2s ease-out' }}
      onClick={onDismiss}
    >
      <div
        className="w-full max-w-sm mx-4 overflow-hidden animate-slide-up"
        style={{ backgroundColor: 'var(--bg)', borderRadius: '16px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 pt-5 pb-4 text-center">
          <div
            className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center"
            style={{ backgroundColor: hasUpdate ? '#E8F4FD' : '#E8F8E8' }}
          >
            <Icon name={hasUpdate ? 'refresh' : 'check'} size={24} color={hasUpdate ? '#5DADE2' : '#4CAF50'} strokeWidth={2} />
          </div>
          <h3 className="text-[16px] font-semibold mb-1" style={{ color: 'var(--ink)' }}>
            {hasUpdate ? '发现新版本' : '已是最新版本'}
          </h3>
          <p className="text-[13px] mb-1" style={{ color: 'var(--ink2)' }}>
            {latest.name || `v${CURRENT_VERSION}`}
          </p>
          <p className="text-[12px] mb-3" style={{ color: 'var(--muted)' }}>
            当前版本 v{CURRENT_VERSION}
          </p>
          {latest.body && (
            <div
              className="text-left text-[12px] leading-relaxed max-h-32 overflow-y-auto px-3 py-2.5 rounded-xl"
              style={{ backgroundColor: 'var(--bg2)', color: 'var(--ink2)' }}
            >
              {latest.body.split('\n').filter(l => l.trim()).slice(0, 8).map((line, i) => (
                <p key={i} className={i === 0 ? 'font-medium mb-1' : 'mb-0.5'} style={{ color: i === 0 ? 'var(--ink)' : undefined }}>
                  {line.replace(/^#+\s*/, '').replace(/^\*\*.*?\*\*/, m => m.replace(/\*\*/g, ''))}
                </p>
              ))}
            </div>
          )}
        </div>
        <div className="flex border-t" style={{ borderColor: 'var(--rule)' }}>
          {hasUpdate ? (
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3.5 text-center text-[15px] font-medium transition-opacity hover:opacity-80"
              style={{ color: '#5DADE2' }}
            >
              去更新
            </a>
          ) : (
            <>
              <a
                href={downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3.5 text-center text-[15px] font-medium transition-opacity hover:opacity-80"
                style={{ color: '#5DADE2' }}
              >
                下载新版本
              </a>
              <div className="w-px" style={{ backgroundColor: 'var(--rule)' }} />
              <button
                onClick={onDismiss}
                className="flex-1 py-3.5 text-center text-[15px] font-medium transition-opacity hover:opacity-80"
                style={{ color: '#4CAF50' }}
              >
                好的
              </button>
            </>
          )}
          {hasUpdate && (
            <>
              <div className="w-px" style={{ backgroundColor: 'var(--rule)' }} />
              <button
                onClick={onDismiss}
                className="flex-1 py-3.5 text-center text-[15px] transition-opacity hover:opacity-80"
                style={{ color: 'var(--muted)' }}
              >
                稍后再说
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function SettingsPage() {
  const [showDataModal, setShowDataModal] = useState(false)
  const [showAboutModal, setShowAboutModal] = useState(false)
  const [lastBackupDate, setLastBackupDate] = useState(null)
  const [backingUp, setBackingUp] = useState(false)
  const [updateChecking, setUpdateChecking] = useState(false)
  const [updateResult, setUpdateResult] = useState(null) // null | { hasUpdate, latest }
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)

  const handleBackupNow = async () => {
    if (backingUp) return
    setBackingUp(true)
    try {
      const data = await exportAllData()
      const json = JSON.stringify(data, null, 2)
      await saveOrShareFile(json, `慧记数据_${new Date().toISOString().split('T')[0]}.json`, 'application/json', { title: '备份慧记数据' })
      await recordBackupDate()
      setLastBackupDate(new Date().toISOString())
    } catch (err) {
      console.error('备份失败:', err)
      alert('备份失败，请重试')
    }
    setBackingUp(false)
  }

  const handleCheckUpdate = async () => {
    if (updateChecking) return
    setUpdateChecking(true)
    try {
      const result = await forceCheckUpdate()
      setUpdateResult(result)
      if (result?.latest) setShowUpdateModal(true)
    } catch {
      setUpdateResult(null)
    }
    setUpdateChecking(false)
  }

  const settingItems = [
    { iconName: 'save', label: '数据管理', desc: '导出/导入/清空', onClick: () => setShowDataModal(true) },
    { iconName: 'refresh', label: '检查更新', desc: updateChecking ? '检查中...' : (updateResult?.hasUpdate ? `发现新版本 ${updateResult.latest?.name}` : `当前版本 v${CURRENT_VERSION}`), onClick: handleCheckUpdate },
    { iconName: 'mail', label: '联系作者', desc: '建议与反馈', onClick: () => setShowContactModal(true) },
    { iconName: 'info', label: '关于慧记', desc: 'AI 情绪感知日记', onClick: () => setShowAboutModal(true) },
  ]

  return (
    <div className="w-full py-6 pb-24 animate-fade-in max-w-[800px] mx-auto">
      {/* 设置项容器 */}
      <div className="huiji-card overflow-hidden p-6">
        {/* 个人信息 */}
        <ProfileSettingsPanel />

        <div className="border-t" style={{ borderColor: 'var(--rule)' }} />

        {/* 外观设置 */}
        <div className="mb-4">
          <div className="text-sm font-medium" style={{ color: 'var(--ink)' }}>外观设置</div>
        </div>
        <div className="mb-6">
          <div className="flex items-center justify-between h-12 px-4 rounded-[8px]" style={{ backgroundColor: 'var(--bg)' }}>
            <div className="flex items-center gap-3">
              <Icon name="palette" size={18} color="var(--muted)" />
              <span className="text-sm" style={{ color: 'var(--ink)' }}>主题模式</span>
            </div>
            <ThemeSwitcher variant="inline" />
          </div>
        </div>

        <div className="border-t mb-6" style={{ borderColor: 'var(--rule)' }} />

        {/* AI 设置 */}
        <AISettingsPanel />

        <div className="border-t" style={{ borderColor: 'var(--rule)' }} />

        {/* 小慧 */}
        <XiaohuiSettingsPanel />

        <div className="border-t" style={{ borderColor: 'var(--rule)' }} />

        {/* 隐私保护 */}
        <PrivacySettingsPanel />

        <div className="border-t" style={{ borderColor: 'var(--rule)' }} />

        {/* 工具栏定制 */}
        <ToolbarSettings />

        <div className="border-t" style={{ borderColor: 'var(--rule)' }} />

        {/* 提醒通知 */}
        <ReminderSettingsPanel
          lastBackupDate={lastBackupDate}
          onLastBackupDateChange={setLastBackupDate}
          onBackupNow={handleBackupNow}
          backingUp={backingUp}
        />

        <div className="border-t my-6" style={{ borderColor: 'var(--rule)' }} />

        {/* 数据管理 / 关于 */}
        <div>
          <div className="mb-4">
            <div className="text-sm font-medium" style={{ color: 'var(--ink)' }}>数据与关于</div>
          </div>
          {settingItems.map((item, index) => (
            <button
              key={index}
              onClick={item.onClick || undefined}
              disabled={!item.onClick}
              className="w-full flex items-center gap-3 h-12 px-4 rounded-[8px] text-left transition-all duration-200 hover:bg-[var(--bg2)] group disabled:cursor-default disabled:hover:bg-transparent"
            >
              <Icon name={item.iconName} size={18} color="var(--muted)" />
              <div className="flex-1">
                <div className="text-sm" style={{ color: 'var(--ink)' }}>{item.label}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{item.desc}</div>
              </div>
              {item.onClick && (
                <Icon name="chevron-right" size={16} color="var(--muted)" className="transition-transform duration-200 group-hover:translate-x-1" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 底部版本号 */}
      <div className="mt-8 text-center">
        <p className="text-xs" style={{ color: 'var(--muted)' }}>慧记 v{CURRENT_VERSION}</p>
      </div>

      {/* 数据管理弹窗 */}
      {showDataModal && (
        <DataManagementModal
          onClose={() => setShowDataModal(false)}
          onRefresh={() => {}}
          onBackupComplete={setLastBackupDate}
        />
      )}

      {/* 关于慧记弹窗 */}
      {showAboutModal && (
        <AboutModal onClose={() => setShowAboutModal(false)} />
      )}

      {/* 联系作者弹窗 */}
      {showContactModal && (
        <ContactAuthorModal onClose={() => setShowContactModal(false)} />
      )}

      {/* 更新弹窗 */}
      {showUpdateModal && updateResult?.latest && (
        <UpdateModal
          latest={updateResult.latest}
          hasUpdate={updateResult.hasUpdate}
          onDismiss={() => setShowUpdateModal(false)}
        />
      )}
    </div>
  )
}

export default SettingsPage
