import { EDITOR_COMPONENT } from '../../dataset/constant/Editor'
import { IEditorOption } from '../../interface/Editor'
import { findParent } from '../../utils'
import { Cursor } from '../cursor/Cursor'
import { Control } from '../draw/control/Control'
import { Draw } from '../draw/Draw'
import { HyperlinkParticle } from '../draw/particle/HyperlinkParticle'
import { DateParticle } from '../draw/particle/date/DateParticle'
import { Previewer } from '../draw/particle/previewer/Previewer'
import { TableTool } from '../draw/particle/table/TableTool'
import { RangeManager } from '../range/RangeManager'
import { CanvasEvent } from './CanvasEvent'

export class GlobalEvent {

  private draw: Draw
  private canvas: HTMLCanvasElement
  private options: Required<IEditorOption>
  private cursor: Cursor | null
  private canvasEvent: CanvasEvent
  private range: RangeManager
  private previewer: Previewer
  private tableTool: TableTool
  private hyperlinkParticle: HyperlinkParticle
  private control: Control
  private dateParticle: DateParticle
  private dprMediaQueryList: MediaQueryList

  constructor(draw: Draw, canvasEvent: CanvasEvent) {
    this.draw = draw
    this.canvas = draw.getPage()
    this.options = draw.getOptions()
    this.canvasEvent = canvasEvent
    this.cursor = null
    this.range = draw.getRange()
    this.previewer = draw.getPreviewer()
    this.tableTool = draw.getTableTool()
    this.hyperlinkParticle = draw.getHyperlinkParticle()
    this.dateParticle = draw.getDateParticle()
    this.control = draw.getControl()
    this.dprMediaQueryList = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`)
  }

  public register() {
    this.cursor = this.draw.getCursor()
    this.addEvent()
  }

  private addEvent() {
    window.addEventListener('blur', this.recoverEffect)
    document.addEventListener('keyup', this.setRangeStyle)
    document.addEventListener('click', this.recoverEffect)
    document.addEventListener('mouseup', this.setCanvasEventAbility)
    document.addEventListener('wheel', this.setPageScale, { passive: false })
    document.addEventListener('visibilitychange', this._handleVisibilityChange)
    this.dprMediaQueryList.addEventListener('change', this._handleDprChange)
  }

  public removeEvent() {
    window.removeEventListener('blur', this.recoverEffect)
    document.removeEventListener('keyup', this.setRangeStyle)
    document.removeEventListener('click', this.recoverEffect)
    document.removeEventListener('mouseup', this.setCanvasEventAbility)
    document.removeEventListener('wheel', this.setPageScale)
    document.removeEventListener('visibilitychange', this._handleVisibilityChange)
    this.dprMediaQueryList.removeEventListener('change', this._handleDprChange)
  }

  public recoverEffect = (evt: Event) => {
    if (!this.cursor) return
    const cursorDom = this.cursor.getCursorDom()
    const agentDom = this.cursor.getAgentDom()
    const innerDoms = [this.canvas, cursorDom, agentDom, document.body]
    if (innerDoms.includes(evt.target as any)) {
      this.setRangeStyle()
      return
    }
    // 编辑器外部dom
    const outerEditorDom = findParent(
      evt.target as Element,
      (node: Node & Element) => !!node && node.nodeType === 1 && !!node.getAttribute(EDITOR_COMPONENT),
      true
    )
    if (outerEditorDom) {
      this.setRangeStyle()
      return
    }
    this.cursor.recoveryCursor()
    // 失去光标清除键盘监听事件
    document.removeEventListener('keyup', this.setRangeStyle)
    this.range.recoveryRangeStyle()
    this.previewer.clearResizer()
    this.tableTool.dispose()
    this.hyperlinkParticle.clearHyperlinkPopup()
    this.control.destroyControl()
    this.dateParticle.clearDatePicker()
  }

  public setCanvasEventAbility = () => {
    this.canvasEvent.setIsAllowDrag(false)
    this.canvasEvent.setIsAllowSelection(false)
  }

  public setRangeStyle = () => {
    this.range.setRangeStyle()
  }

  public setPageScale = (evt: WheelEvent) => {
    if (!evt.ctrlKey) return
    evt.preventDefault()
    const { scale } = this.options
    if (evt.deltaY < 0) {
      // 放大
      const nextScale = scale * 10 + 1
      if (nextScale <= 30) {
        this.draw.setPageScale(nextScale / 10)
      }
    } else {
      // 缩小
      const nextScale = scale * 10 - 1
      if (nextScale >= 5) {
        this.draw.setPageScale(nextScale / 10)
      }
    }
  }

  private _handleVisibilityChange = () => {
    if (document.visibilityState) {
      this.cursor?.drawCursor()
    }
  }

  private _handleDprChange = () => {
    this.draw.setPageDevicePixel()
  }

}