import type { DirectiveBinding } from 'vue'

type ObserveHandler = (
  isIntersecting: boolean,
  entries: IntersectionObserverEntry[],
  observer: IntersectionObserver,
) => void

export interface ObserveDirectiveBinding
  extends Omit<DirectiveBinding, 'modifiers' | 'value'> {
  value?:
    | ObserveHandler
    | { handler: ObserveHandler; options?: IntersectionObserverInit }
  modifiers: {
    once?: boolean
    quiet?: boolean
  }
}

function mounted(
  el: HTMLElement & { _observe?: any },
  binding: ObserveDirectiveBinding,
) {
  if (!('IntersectionObserver' in window)) return
  const modifiers = binding.modifiers || {}
  const value = binding.value
  const { handler, options } =
    typeof value === 'object'
      ? value
      : { handler: value, options: {} }

  const observer = new IntersectionObserver(
    (
      entries: IntersectionObserverEntry[] = [],
      observer: IntersectionObserver,
    ) => {
      const _observe = el._observe?.[binding.instance!.$.uid]
      if (!_observe) return

      const isIntersecting = entries.some(
        entry => entry.isIntersecting,
      )

      if (
        handler &&
        (!modifiers.quiet || _observe.init) &&
        (!modifiers.once || isIntersecting || _observe.init)
      ) {
        handler(isIntersecting, entries, observer)
      }

      if (isIntersecting && modifiers.once) unmounted(el, binding)
      else _observe.init = true
    },
    options,
  )

  el._observe = Object(el._observe)
  el._observe![binding.instance!.$.uid] = { init: false, observer }

  observer.observe(el)
}

function unmounted(
  el: HTMLElement & { _observe?: any },
  binding: ObserveDirectiveBinding,
) {
  const observe = el._observe?.[binding.instance!.$.uid]
  if (!observe) return

  observe.observer.unobserve(el)
  delete el._observe![binding.instance!.$.uid]
}

export const Intersect = {
  mounted,
  unmounted,
}

export default Intersect
