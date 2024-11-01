/**
 * 给 console 打印的日志前面 添加文件名和行列号
 */

import * as parser from '@babel/parser'
import _traverse from '@babel/traverse'
import _generator from '@babel/generator'
import types from '@babel/types'

const traverse = _traverse.default
const generator = _generator.default

const sourceCode = `
console.log(1)
function func() {
  console.info('info')
}
export default class Say {
  name = 'why'
  render() {
    return <div>{console.error('render error')}</div>
  }
}
`

const ast = parser.parse(sourceCode, {
  sourceType: 'unambiguous',
  plugins: ['jsx']
})

const consoleCalleeNames = ['log', 'info', 'error'].map((name) => `console.${name}`)

traverse(ast, {
  CallExpression(path, state) {
    const { node } = path
    const { code: calleeName } = generator(node.callee)
    if (consoleCalleeNames.includes(calleeName)) {
      const { line, column } = node.loc.start;
      node.arguments.unshift(types.stringLiteral(`filename: (${line}, ${column})`))
    }
  }
})

const { code } = generator(ast)

console.log(code)
