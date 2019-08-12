# typescript
必须学会的一门js超集语言。参考：<br />
[TypeScript入门教程](https://ts.xcatliu.com)<br/>
[TypeScript Handbook（中文版）](https://zhongsp.gitbooks.io/typescript-handbook/content/)

## BASE
### 原始数据类型 Primitive data types

``` ts
let bol: boolean = true;
let num: number = 1;
let str: string = 'str';

// null undefined是上述类型的子集，因此上述类型的值是可以被赋值null/undefined
let n: null = null;
let u: undefined = undefined;

// void是一种无意义的值，ts一般用来定义没有返回的函数
function alertName (name: string): void {
  alert(name)
}
// 如果一个值为void，则它只能为null/undefined
let unusable: void = undefined;
```

### 任意类型 Any
以我之言，此类型可视作js中的普通类型。它可以被赋值为任意的原始类型。
``` ts
let anyVar: any = 'seven';
anyVar = 7;
anyVar = false;

// 如若在声明时未赋值，则自动视作any
let someval;
someval = 'some'
someval = 1
```

### 联合类型 Union Types
``` TS
let value: string | number = 9
value = '9'
```
联合类型指，该变量可以为多种类型中的一种。多种类型之间使用`|`分割。<br />

> 当 TypeScript 不确定一个联合类型的变量到底是哪个类型的时候，我们只能访问此联合类型的所有类型里共有的属性或方法。

这句话是指，一个联合类型的变量，在没有被赋值的情况下，它只能访问联合类型中的共有方法和属性。**这通常在函数形参中展现**。
``` ts
function getLength(something: string | number): number {
    return something.length;
}
```

如上，`something`是一个联合类型的参数，声明函数时是无法知晓调用时的入参是哪种类型（`string` or `number`）。因此在该函数体内，`something`只能访问string和number的共同属性和方法。而number没有`length`属性，编译时会报错。

### 对象类型 —— 接口 Interfaces
其实就是定义一个对象的属性的数据类型
``` TS
interface Person {
  name: string;
  age: number;
}

let person: Person {
  name: 'Jenny',
  age: 18
}
```
`person`中的属性name、age的属性必须和定义的Person中的属性类型一致，并且多一个或少一个属性是不允许的。

#### 可选属性
此时，如果具备一个未知是否存在的属性，可以使用`?`表示可选属性
```TS
interface Person {
  name: string;
  age: number;
  nation?: string;
}

let jenny: Person = {
  name: 'Jenny',
  age: 18
}

let tonny: Person = {
  name: 'Jenny',
  age: 18,
  nation: 'China'
}
```
可选属性的含义是该属性可以不存在。但仍然不允许添加未定义的属性。

#### 任意属性
上述的规则限制了对象属性的自由性，当我们需要给对象添加任意一个属性时，可以使用`任意属性`的定义方法

``` TS
interface Person {
  name: string;
  age: number;
  [propName: string]: any;
}
```
**一旦定义了任意属性，那么确定属性和可选属性的类型都必须是它的类型的subset。**

#### 只读属性 readonly
使用`readonly`修饰属性，使其只能在对象被赋值时赋值
``` TS
interface Person {
  readonly name: string;
  age: number;
}
```

### 数组类型
#### 类型 [] 表示
``` TS
let arr1: number [] = [1, 2, 3, 4]
let arr2: string [] = ['1', '2', '3', '4']

// if you want to define an array by 'any'
let arr3: any [] = [1, '2', null, undefined]
```

#### 数组泛型
``` TS
// 表示arr是number组成的数组
let arr: Array<number> = [1, 2, 3, 4]
```

#### 接口表示
we can represent array in terms of 'interface', for it's also object.

``` TS
interface NumberArray {
  [index: number]: number;
}
let arr: NumberArray = [1, 2, 3, 4];
```

### 函数类型
函数类型的定义其实就是定义其输入和输出的参数类型。但是函数声明和函数表达式的定义是不一样的
#### Function Declaration
```TS
function fn ( x: number, y: number ): number {
  return x + y
}
```
**输入参数的个数必须与定义时是一致的**

#### Function Expression
```TS
let fn: (x: number, y: number) => number = function (x: number, y: number): number {
  return x + y
}
```
`(x: number, y: number) => number`其实就是定义`fn`函数类型表达式。<br />
该表达式可以抽出为一个`interface`。

``` TS
interface sumFunc = {
  (x: number, y: number): number;
}

let fn: sumFunc = function (x: number, y: number): number {
  return x + y
}
```

#### 可选的输入参数
和`interface`表现一致，使用`?`表示参数是否可选。但是可选参数必须在确定参数之后。

```TS
function fn (name: string, age?: number): string {
  return age ? `${name} is ${age}` ? `${name}`
}
```

#### 默认值
``` TS
function buildName(firstName: string = 'Tom', lastName: string) {
  return firstName + ' ' + lastName;
}
```

#### 剩余参数
同es6，使用扩展运算符，类型为数组

``` TS
function push(array: any[], ...items: any[]) {
  items.forEach(function(item) {
      array.push(item);
  });
}
```

#### 重载
JS，函数重载，其实就是根据参数的个数类型执行不同的实现。TS依然没有离开这种设定

``` TS
function reverse(x: number): number;
function reverse(x: string): string;
function reverse(x: number | string): number | string {
  if (typeof x === 'number') {
    return Number(x.toString().split('').reverse().join(''));
  } else if (typeof x === 'string') {
    return x.split('').reverse().join('');
  }
}
```
### 类型断言
> 类型断言（Type Assertion）可以用来手动指定一个未知类型值的类型。

使用方式：`<类型>值` or `值 as 类型`

``` ts
function getLength(something: string | number): number {
  if ( (<string>something).length ) {
    return ( <string>something ).length;
  } else {
    return something.toString().length;
  }
}
```

### 声明文件

### 内置对象

## Advance
### 类型别名
顾名思义，给类型起一个nice name。

``` TS
type Str = string
type NoS = number | string

let str: Str = '9999';
let str2: Nos = 12;
```

### 字符串字面量类型
其实就是类似于`indexOf`校验的实现。

``` TS
type names = 'a' | 'b' | 'c';
```

### 元组
元组和数组的区别在于，数组是统一声明所有项的类型，元组是必须单独设置每一项的类型。
``` TS
let originArr: [string, number]
originArr[0] = 'String'
originArr[1] = 0
```

初始化时，必须设置所有值，否则抛出错误
``` TS
let originArr: [string, number] = ['String', 0]
```

在新增超出定义类型边界下标时，push的值必须是已定义类型的联合类型（即之一）
``` TS
let originArr: [string, number] = ['String', 0]
originArr.push(0) // string | number
originArr.push('xxx') // string | number
```

### 枚举 ENUM
> 使用枚举我们可以定义一些带名字的常量。 使用枚举可以清晰地表达意图或创建一组有区别的用例。 TypeScript支持数字的和基于字符串的枚举。

#### 数字枚举
``` TS
enum Direction {
  UP = 1,
  DOWN,
  LEFT,
  RIGHT
}

let direct: Direction;
direct = Direction.DOWN // 2

```
上述定义一个数字枚举，`UP`赋值为1，则后续属性值会自增长（如果`UP`未声明值，则从`0`开始自增长）。声明`Direction`枚举类型的变量`direct`，它的取值必须是以`Direction[key]`来实现映射值。<br />

枚举值可以除了使用静态值，还可以使用`计算值`（比如：函数返回值）。如果存在计算值属性，则该属性必然是在具备`initializer 初始化器`的属性的前面，或者是在最后。换句话说针对不带`initializer`的属性，其可以在第一位，or 数字常量 or 具备`initializer`的属性之后。

#### 字符串枚举
``` TS
enum Direction {
  UP = 'TOP',
  DOWN = 'BOTTOM',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT'
}

let direct: Direction;
direct = Direction.DOWN // BOTTOM
```
字符串枚举，属性值皆为字符串，可以很好的序列化。

<br />(To be continued...)
