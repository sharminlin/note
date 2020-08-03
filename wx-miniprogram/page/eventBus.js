import { isFunc } from './tool'
const isEventName = name => !!name
const error = msg => new Error('from EventBus: ' + msg)

class EventBus {
  constructor () {
    this.listeners = new Map()

    // 建议使用带$的函数
    this.$on = this.on.bind(this)
    this.$off = this.off.bind(this)
    this.$emit = this.emit.bind(this)
    this.$fire = this.fire.bind(this)
  }

  /**
   * 注册事件
   * @param {*} eventName
   * @param {*} fn
   */
  on (eventName, fn) {
    if (!isFunc(fn)) {
      throw error('fn is not a function!')
    }

    if (!isEventName(eventName)) {
      throw error(eventName + ' is invalid!')
    }

    let listeners = this.listeners

    if (listeners.has(eventName)) {
      let listener = listeners.get(eventName)
      !listener.has(fn) && listener.add(fn)
    } else {
      listeners.set(eventName, new Set([fn]))
    }
  }

  /**
   * 触发事件
   * @param {*} eventName
   * @param  {...any} args
   */
  emit (eventName, ...args) {
    if (!isEventName(eventName)) {
      throw error(eventName + ' is invalid!')
    }

    let listener = this.listeners.get(eventName)
    if (!listener) return

    listener.forEach(listen => {
      listen(...args)
    })
  }

  /**
   * 卸载事件
   * @param {*} eventName
   * @param {*} fn 可选
   */
  off (eventName, fn) {
    if (!isEventName(eventName)) {
      throw error(eventName + ' is invalid!')
    }

    if (fn && !isFunc(fn)) {
      throw error('fn is not a function!')
    }

    let listeners = this.listeners
    if (!listeners.has(eventName)) return

    let listener = listeners.get(eventName)

    if (!fn) {
      listener.clear()
      listeners.delete(eventName)
    } else {
      listener.delete(fn)
    }
  }

  /**
   * 卸载所有
   */
  fire () {
    this.listeners.clear()
  }
}

export default EventBus
