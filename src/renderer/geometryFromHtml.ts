export const getElementScale = (element: HTMLElement) => {
  // from leaflet utils
  // use this or you'll need to track n-levels of zoom to correct drag movement
  const elementRect = element.getBoundingClientRect()
  const scaleX = elementRect.width / element.offsetWidth || 1
  const scaleY = elementRect.height / element.offsetHeight || 1

  return { scaleX, scaleY }
}

export const getPointInElement = (
  element: HTMLElement,
  point: { clientX: number; clientY: number } // e.g. from mouseevent
) => {
  const rect = element.getBoundingClientRect()
  const { scaleX, scaleY } = getElementScale(element)

  const elementX = (point.clientX - rect.left) / scaleX
  const elementY = (point.clientY - rect.top) / scaleY

  return { x: elementX, y: elementY, scaleX, scaleY }
}

export const getBrowserZoom = () =>
  Math.round((window.outerWidth / window.innerWidth) * 100) / 100
