/**
 * 虚拟DOM的diff策略
 */

/**
 * 首先实现一个JS对象树转化成DOM对象节点
 * createElement = (..args) => new Element(...args)
 * createElement(
 *  'div',
 *  {
 *    className: 'text'
 *  },
 *  [
 *    'hello',
 *    createElement(...).create()
 *  ],
 *  'key-one'
 * ).render()
 */
class Element {
  /**
	 * @param {String} tag 'div' // 标签
	 * @param {Object} props { class: 'item' } // 标签上的属性
	 * @param {Array} children [ Element, 'text'] // 字节点集合
	 * @param {String} key option
	 */
  constructor (tag, props, children, key) {
    this.tag = tag
    this.props = props
    if (Array.isArray(children)) {
      this.children = children
    } else if (isString(children)) {
      this.key = children
      this.children = null 
    }
    if (key) this.key = key
  }

  render () {
    let root = this._createElement(
      this.tag,
      this.props,
      this.children,
      this.key
    )
    document.appendChild(root)
  }

  create () {
    return this._createElement(
      this.tag,
      this.props,
      this.children,
      this.key
    )
  }

  _createElement (tag, props, children, key) {
    // 创建结点
    const root = document.createElement(tag)
    // 设置属性
    for (let key in props) {
      if (props.hasOwnProperty(key)) {
        const value = props[key]
        root.setAttribute(key, value)
      }
    }

    // 设置key值
    if (key) {
			el.setAttribute('key', key)
    }
    
    // 递归，判断类型，添加子节点
    if (children) {
      children.map(element => {
        let child
        if (element instanceof Element) {
          child = this._createElement(
            element.tag,
            element.props,
            element.children,
            element.key
          )
        } else {
          child = document.createTextNode(element)
        }
        root.appendChild(child)
      })
    }

    return root
  }
}
