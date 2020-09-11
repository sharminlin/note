import Vue from 'vue'

/**
 * 动态生成一个组件挂载到DOM上
 * @date 2020-9-11
 */
const appendComponent = (function () {
  const instanceMap = new Map()
  return {
    /**
     * 创建包装实例
     * @param {VueComponent} component 挂载的组件，内部触发destroy可收回DOM
     * @param {VueComponent} parent 父组件实例，必填，需要继承注入的属性，或者父子通信
     * @return {Symbol} 返回一个唯一值，可通过getInstance获取该实例
     */
    create (component, { props = {}, parent, appendToBody = true }) {
      const symbol = Symbol('append-component')
      const that = this
      const instance = new Vue({
        parent: parent,
        render (h) {
          return h(component, {
            props: props,
            on: {
              'hook:destroyed': function () {
                that.destroy(symbol)
              }
            }
          })
        }
      })
      instance.appendToBody = appendToBody
      instanceMap.set(symbol, instance.$mount())
      return symbol
    },
    /**
     * 通过 唯一值进行append
     */
    appendBy (symbol) {
      const instance = this.getInstance(symbol)
      if (!instance) return;
      if (instance.appendToBody) {
        document.body.appendChild(instance.$el)
      } else {
        instance.$el.parentNode.appendChild(instance.$el)
      }
    },
    destroy (symbol) {
      const instance = this.getInstance(symbol)
      if (!instance) return;
      instance.$destroy()
      if (instance.$el && instance.$el.parentNode) {
        instance.$el.parentNode.removeChild(instance.$el);
      }
      instanceMap.delete(symbol)
    },
    getInstance (symbol) {
      return instanceMap.get(symbol)
    }
  }
})();

export default appendComponent
