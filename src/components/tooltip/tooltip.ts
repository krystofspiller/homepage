import { arrow, computePosition, flip, offset, shift } from "@floating-ui/dom"

export const initTooltip = (
  button: Element,
  tooltip: HTMLElement,
  arrowElement: HTMLElement,
): void => {
  let hideTimeout: ReturnType<typeof setTimeout> | null = null

  const update = async (): Promise<void> => {
    const { x, y, placement, middlewareData } = await computePosition(
      button,
      tooltip,
      {
        placement: "top",
        middleware: [
          offset(5),
          flip(),
          shift({ padding: 8 }),
          arrow({ element: arrowElement }),
        ],
      },
    )

    Object.assign(tooltip.style, {
      left: `${x}px`,
      top: `${y}px`,
    })

    const { x: arrowX, y: arrowY } = middlewareData.arrow ?? { x: 0, y: 0 }
    const map = {
      top: "bottom",
      right: "left",
      bottom: "top",
      left: "right",
    }
    const [staticSideIndex, _] = placement.split("-")
    const staticSide = staticSideIndex
      ? map[staticSideIndex as keyof typeof map]
      : "top"

    Object.assign(arrowElement.style, {
      left: arrowX === null ? "" : `${arrowX}px`,
      top: arrowY === null ? "" : `${arrowY}px`,
      right: "",
      bottom: "",
      [staticSide]: "-4px",
    })
  }

  const showTooltip = (): void => {
    if (hideTimeout) {
      clearTimeout(hideTimeout)
      hideTimeout = null
    }
    tooltip.style.visibility = "visible"
    tooltip.style.opacity = "1"
    update()
  }

  const hideTooltip = (): void => {
    hideTimeout = setTimeout(() => {
      tooltip.style.visibility = "hidden"
      tooltip.style.opacity = "0"
      hideTimeout = null
    }, 100)
  }

  // Add event listeners to the button
  for (const [event, listener] of [
    ["mouseenter", showTooltip],
    ["mouseleave", hideTooltip],
    ["focus", showTooltip],
    ["blur", hideTooltip],
  ] as const) {
    button.addEventListener(event, listener)
  }

  // Add event listeners to the tooltip to keep it visible when hovering over it
  for (const [event, listener] of [
    ["mouseenter", showTooltip],
    ["mouseleave", hideTooltip],
  ] as const) {
    tooltip.addEventListener(event, listener)
  }
}
