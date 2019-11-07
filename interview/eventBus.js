const isFunc = fn => typeof fn === 'function'
const isEventName = name => !!name
const error = msg => new Error('EventBus: ' + msg)

class EventBus {
  constructor () {
    this.listeners = new Map()

    this.$on = this.on.bind(this)
    this.$off = this.off.bind(this)
    this.$emit = this.emit.bind(this)
    this.$fire = this.fire.bind(this)
  }

  on (eventName, fn) {
    if (!isFunc(fn)) {
      throw error('fn is not a function!')
    }

    if (!isEventName(eventName)) {
      throw error(eventName +  ' is invalid!')
    }

    let listeners = this.listeners

    if (listeners.has(eventName)) {
      let listener = listeners.get(eventName)
      !listener.has(fn) && listener.add(fn)
    } else {
      listeners.set(eventName, new Set([fn]))
    }
  }

  emit (eventName, ...args) {
    if (!isEventName(eventName)) {
      throw error(eventName + ' is invalid!')
    }

    let listener = this.listeners.get(eventName)
    if (!listener) {
      console.error(error(eventName + ' is not registerd!'))
      return
    }

    listener.forEach(listen => {
      listen(...args)
    })
  }

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

  fire () {
    this.listeners.clear()
  }
}

export default EventBus
