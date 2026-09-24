type ToastType = 'success' | 'error' | 'info'

let container: HTMLDivElement | null = null

const ICONS: Record<ToastType, string> = {
  success: 'text-emerald-500',
  error: 'text-amber-600',
  info: 'text-brand-500',
}

const BG: Record<ToastType, string> = {
  success: 'border-emerald-200 bg-emerald-50',
  error: 'border-amber-200 bg-amber-50',
  info: 'border-brand-200 bg-brand-50',
}

function ensureContainer() {
  if (container) return container
  container = document.createElement('div')
  container.setAttribute('aria-live', 'polite')
  container.className = 'fixed top-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm'
  document.body.appendChild(container)
  return container
}

export function showToast(message: string, type: ToastType = 'info', durationMs = 4000) {
  const wrap = ensureContainer()

  const el = document.createElement('div')
  el.className = `flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-sm opacity-0 translate-x-4 transition-all duration-300 ${BG[type]}`
  el.style.animation = 'toastIn 0.3s ease-out forwards'

  // Build via innerHTML (zero-dep, no React reconciliation needed)
  el.innerHTML = `
    <span class="flex-shrink-0 mt-0.5 ${ICONS[type]}"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      ${
        type === 'success'
          ? '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>'
          : type === 'error'
            ? '<circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>'
            : '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>'
      }
    </svg></span>
    <span class="text-sm font-medium text-surface-800 leading-snug">${message}</span>
    <button class="ml-auto flex-shrink-0 p-0.5 rounded hover:bg-surface-200/60 transition-colors" aria-label="Fermer">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-surface-400"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
    </button>
  `

  el.querySelector('button')!.onclick = () => dismiss(el)

  wrap.appendChild(el)
  // trigger enter transition
  requestAnimationFrame(() => {
    el.classList.remove('opacity-0', 'translate-x-4')
    el.classList.add('opacity-100', 'translate-x-0')
  })

  if (durationMs > 0) setTimeout(() => dismiss(el), durationMs)
}

function dismiss(el: HTMLDivElement) {
  el.classList.remove('opacity-100', 'translate-x-0')
  el.classList.add('opacity-0', 'translate-x-4')
  setTimeout(() => el.remove(), 300)
}

// Inject keyframes once
if (typeof document !== 'undefined' && !document.getElementById('toast-keyframes')) {
  const style = document.createElement('style')
  style.id = 'toast-keyframes'
  style.textContent = `@keyframes toastIn{from{opacity:0;transform:translateX(1rem)}to{opacity:1;transform:translateX(0)}}`
  document.head.appendChild(style)
}