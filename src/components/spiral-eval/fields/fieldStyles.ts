import { cn } from '../../../lib/utils'

/**
 * One definition of what a form control looks like. 48px tall to clear the
 * touch-target minimum on the iPads these are filled out on, and 16px text so
 * iOS Safari doesn't zoom the page in on focus.
 */
export function controlClass(invalid: boolean, extra?: string): string {
  return cn(
    'w-full h-12 px-4 rounded-lg border text-base bg-white',
    'focus:outline-none focus:ring-2 focus:ring-blue-700 focus:border-transparent',
    'disabled:bg-gray-100 disabled:text-gray-500',
    invalid ? 'border-red-500 bg-red-50' : 'border-gray-400',
    extra,
  )
}

/** Choice buttons in radio and checkbox groups. */
export function choiceClass(selected: boolean, invalid: boolean, extra?: string): string {
  return cn(
    'min-h-[48px] px-4 py-2 border text-base font-medium transition-colors',
    'disabled:opacity-60',
    selected
      ? 'border-brand bg-blue-50 text-brand ring-1 ring-brand'
      : 'border-gray-400 bg-white text-gray-800 hover:border-gray-600',
    invalid && !selected && 'border-red-400',
    extra,
  )
}
