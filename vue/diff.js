/**
 * 虚拟DOM的diff策略
 */

/**
 * 首先实现一个JS对象树转化成DOM对象节点
 * createElement = (..args) => new Element(...args)
 * 
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

function diff (oldDomTree, newDomTree) {
  let patches = {}
  dfs(oldDomTree, newDomTree, 0, patches)
  return patches
}

function dfs (oldNode, newNode, idnex, patches) {
  let curPatches = []

  if (!newNode) return
  // 一致
  if (newNode.tag === oldNode.tag && newNode.key === oldNode.key) {
    // 判断属性是否变更
		let props = diffProps(oldNode.props, newNode.props)
		if (props.length) curPatches.push({ type: StateEnums.ChangeProps, props }) // 记录属性变更类型
		// 遍历子树
		diffChildren(oldNode.children, newNode.children, index, patches)
  } else {
    // 不一致
    curPatches.push({ type: StateEnums.Replace, node: newNode }) // 直接替换
  }

  // 记录变更合并
  if (curPatches.length) {
		if (patches[index]) {
			patches[index] = patches[index].concat(curPatches)
		} else {
			patches[index] = curPatches
		}
	}
}

// 收集增删改的属性键值对
function diffProps (oldProps, newProps) {
	// 判断 Props 分以下三步骤 
	// 先遍历 oldProps 查看是否存在删除的属性
	// 然后遍历 newProps 查看是否有属性值被修改
	// 最后查看是否有属性新增
	let change = []
	for (const key in oldProps) {
		if (oldProps.hasOwnProperty(key) && !newProps[key]) {
			change.push({
				prop: key
			})
		}
	}
	for (const key in newProps) {
		if (newProps.hasOwnProperty(key)) {
			const prop = newProps[key]
			if (oldProps[key] && oldProps[key] !== newProps[key]) {
				change.push({
					prop: key,
					value: newProps[key]
				})
			} else if (!oldProps[key]) {
				change.push({
					prop: key,
					value: newProps[key]
				})
			}
		}
	}
	return change
}

/**
 * 判断列表差异
 * 遍历旧的节点列表，查看每个节点是否还存在于新的节点列表中
 * 遍历新的节点列表，判断是否有新的节点
 * 在第二步中同时判断节点是否有移动
 * @param {*} oldList 
 * @param {*} newList 
 * @param {*} index 
 * @param {*} patches 
 */
function listDiff (oldList, newList, index, patches) {
  // 为了遍历方便，先取出所有KEYS
  let oldKeys = getKeys(oldList)
  let newKeys = getKeys(newList)
  let changes = []

  let list = []
  // 获取删除掉的节点key值存入list中
  // list的索引对应oldList索引，未删除的置为null
  oldList &&
    oldList.forEach((item, i) => {
      let key = isString(item) ? item : item.key
      
      let index = newKeys.indexOf(key)
      if (index >= 0) {
        list.push(key)
      } else {
        // 存储删除类型变更
        changes.push({
          type: StateEnums.Remove,
          index: i
        })
      }
    });

  // 此时list存储的null值，一定是newList中存在的
  // 遍历新的list，获取新增&移动的节点
  newList &&
    newList.forEach((item, i) => {
      let key = isString(item) ? item : item.key
      let index = oldKeys.indexOf(key)
      // 表示新增的节点
      if (index === -1) {
        changes.push({
					type: StateEnums.Insert,
					node: item,
					index: i
				})
				list.splice(i, 0, key)
      } else if (i !== index) {
        // 表示节点移动了
        changes.push({
          type: StateEnums.Move,
          from: index,
          to: i
        })
        // 移动
        move(list, index, i)
      }
    });
  return { changes, list }
}

function getKeys(list) {
	let keys = []
	let text
	list &&
		list.forEach(item => {
			let key
			if (isString(item)) {
				key = [item]
			} else if (item instanceof Element) {
				key = item.key
			}
			keys.push(key)
		})
	return keys
}

// 遍历子元素打标识
function diffChildren(oldChild, newChild, index, patches) {
	let { changes, list } = listDiff(oldChild, newChild, index, patches)
	if (changes.length) {
		if (patches[index]) {
			patches[index] = patches[index].concat(changes)
		} else {
			patches[index] = changes
		}
	}
	// 记录上一个遍历过的节点
	let last = null
	oldChild &&
		oldChild.forEach((item, i) => {
			let child = item && item.children
			if (child) {
				index =
					last && last.children ? index + last.children.length + 1 : index + 1
				let keyIndex = list.indexOf(item.key)
				let node = newChild[keyIndex]
				// 只遍历新旧中都存在的节点，其他新增或者删除的没必要遍历
				if (node) {
					dfs(item, node, index, patches)
				}
			} else index += 1
			last = item
		})
}

let index = 0
export default function patch(node, patchs) {
	let changes = patchs[index]
	let childNodes = node && node.childNodes
	// 这里的深度遍历和 diff 中是一样的
	if (!childNodes) index += 1
	if (changes && changes.length && patchs[index]) {
		changeDom(node, changes)
	}
	let last = null
	if (childNodes && childNodes.length) {
		childNodes.forEach((item, i) => {
			index =
				last && last.children ? index + last.children.length + 1 : index + 1
			patch(item, patchs)
			last = item
		})
	}
}

function changeDom(node, changes, noChild) {
	changes &&
		changes.forEach(change => {
			let { type } = change
			switch (type) {
				case StateEnums.ChangeProps:
					let { props } = change
					props.forEach(item => {
						if (item.value) {
							node.setAttribute(item.prop, item.value)
						} else {
							node.removeAttribute(item.prop)
						}
					})
					break
				case StateEnums.Remove:
					node.childNodes[change.index].remove()
					break
				case StateEnums.Insert:
					let dom
					if (isString(change.node)) {
						dom = document.createTextNode(change.node)
					} else if (change.node instanceof Element) {
						dom = change.node.create()
					}
					node.insertBefore(dom, node.childNodes[change.index])
					break
				case StateEnums.Replace:
					node.parentNode.replaceChild(change.node.create(), node)
					break
				case StateEnums.Move:
					let fromNode = node.childNodes[change.from]
					let toNode = node.childNodes[change.to]
					let cloneFromNode = fromNode.cloneNode(true)
					let cloenToNode = toNode.cloneNode(true)
					node.replaceChild(cloneFromNode, toNode)
					node.replaceChild(cloenToNode, fromNode)
					break
				default:
					break
			}
		})
}