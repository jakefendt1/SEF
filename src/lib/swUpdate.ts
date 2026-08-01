/**
 * Pick up a new version of the app as soon as one is deployed.
 *
 * The service worker is generated with `skipWaiting()` + `clientsClaim()`, so
 * a new version activates and takes over the open page by itself. But nothing
 * told the *page* about it: the JavaScript already running stayed on the old
 * bundle, so a returning user saw the old app and only got the new one on some
 * later load. Reload too early -- before the new worker finished installing --
 * and you'd get the old app again, which reads as "the update never shipped".
 *
 * Reloading here is safe: the evaluation form autosaves on a 600ms debounce
 * and rehydrates from Firestore, and the ROI calculator's draft is in
 * localStorage. A reload restores what the user was doing.
 */
export function reloadOnServiceWorkerUpdate(): void {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return

  // On a first-ever visit there is no controller yet, and the worker claiming
  // the page is normal startup -- reloading then would be a pointless flash,
  // and on a slow connection a loop. Only an update replaces an *existing*
  // controller.
  const hadController = Boolean(navigator.serviceWorker.controller)
  let reloading = false

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloading) return
    reloading = true
    window.location.reload()
  })
}
