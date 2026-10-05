import { Menu, nativeImage, Tray } from 'electron'

// A lightning bolt, black on transparent: macOS tints it for the menu bar.
const ICON_1X =
  'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAdUlEQVR42mNgIA4oALEAA5kApPE+AwVgPxSTBRqA+D8QF5CjOQCqGYQNSNUMCrT3UM33yQm080i234d6BYYDCBkwH0kzOn5PyDsJeDT/h8qTBNYjae4nJybuQzWfJzcFwvytQI4BDlADHChJhQ2U5IECBnoAAJu/KevOQyp+AAAAAElFTkSuQmCC'
const ICON_2X =
  'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAA1klEQVR42t2XUQ3EIBBEK+EknAQkIOEkVAISzsFJQEIlVMJKQMJKoFyyH4RAk4ZmJukm8/223WUGluVhFYocC/4tykVvBvxj8MSA/79YrYGIhr+KxODZ/gS0YgXP1hCs1gYuSLhr4NlOAWzuqdMA7PzvHbiizabVhjSbnlbE0ulJA2KjGcndaTZXFe82myua9oYwAdfZZHQTcEgu+BP4j+kJO8qUtsHcYYnYywOPDKQWHpBx7BlZMFrAhL4J1QuorHeAoFJwVJQreL2Awph7fRumvf+eVweZHaVN9gRvUAAAAABJRU5ErkJggg=='

/** The menu-bar icon that keeps the app, and its triggers, running with no window open. */
export function createTray(actions: { open: () => void; quit: () => void }) {
  const icon = nativeImage.createEmpty()
  icon.addRepresentation({
    scaleFactor: 1,
    dataURL: `data:image/png;base64,${ICON_1X}`,
  })
  icon.addRepresentation({
    scaleFactor: 2,
    dataURL: `data:image/png;base64,${ICON_2X}`,
  })
  icon.setTemplateImage(true)
  const tray = new Tray(icon)
  tray.setToolTip('Agent Desktop')
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Open Agent Desktop', click: actions.open },
      { type: 'separator' },
      { label: 'Quit', click: actions.quit },
    ]),
  )
  return tray
}
