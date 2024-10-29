# 常见节点

## Literal 字面量

| 示例   | 字面量名称 |
| ------ | ---------------- | 
| 'string' | StringLiteral    |
| `string` | TemplateLiteral  |
| 1      | NumericLiteral   |
| true   | BooleanLiteral   |
| null   | NullLiteral      |
| undefined | UndefinedLiteral |
| 1n     | BigIntLiteral    |
| /^\d/g  | RegExpLiteral    |

## Identifier 标识符

标识符是程序中用来标识变量、函数、类等名称的对象。变量名、属性名、参数名等各种声明和引用的名字，都是Identifer。

## Statement 语句

可以独立执行的单位，比如 break、continue、debugger、return 或者 if 语句、while 语句、for 语句，还有声明语句，表达式语句等

## Declaration 声明语句

声明语句，比如 let、const、class、function、import、export 等声明语句

## Expression 表达式

执行完以后有返回值，这是和语句 (statement) 的区别

| 示例   | 表达式名称            | 备注 |
| ------ | ----------------     | -------   |
| [1]    | ArrayExpression      | 数组表达式 |
| a = 1  | AssignmentExpression | 赋值表达式 |
| 1 + 1  | BinaryExpression     | 二元表达式 |
| -1     | UnaryExpression      | 一元表达式 |
| function a() {}  | FunctionExpression | 函数表达式 |
| () => {}  | ArrowFunctionExpression | 箭头函数表达式 |
| class A {}  | ClassExpression | 类表达式 |
| a | Identifier | 标识符 | 
| this | ThisExpression | this 表达式 |
| super | Super | super 表达式 |
| a::b | BindExpression | 绑定表达式 |
| a()   | CallExpression       | 调用表达式 |
| a.b   | MemberExpression     | 成员表达式 |
| a?.b  | OptionalMemberExpression | 可选成员表达式 |


## Modules 模块

| 示例   | 声明语句类型            | specifiers 变量说明符类型 |
| ------ | ----------------     | -------   |
| `import`| | |
| import { a } from 'a' | ImportDeclaration | ImportSpecifier |
| import a from 'a' | ImportDeclaration | ImportDefaultSpecifier |
| import * as a from 'a' | ImportDeclaration | ImportNamespaceSpecifier |
| `export` | |
| export default a | ExportDefaultDeclaration |  |
| export { a } | ExportNamedDeclaration | ExportSpecifier |
| export * from 'a' | ExportAllDeclaration |  |

## Comment 注释

| 示例   | 注释类型 |
| ------ | ---------------- |
| // do something | CommentLine |
| /* do something */ | CommentBlock |

## Program

根节点，所有语句的父节点。

## 常用网站

AST 可视化查看工具 https://astexplorer.net/
