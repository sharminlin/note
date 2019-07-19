# typescript
必须学会的一门js超集语言。感谢作者，[TypeScript入门教程](https://ts.xcatliu.com)<br/>

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
**一旦定义了任意属性，那么确定属性和可选属性的类型都必须是它的类型的子集。**

#### 只读属性
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
// 当然如果不限制，使用any
let arr3: any [] = [1, '2', null, undefined]
```

#### 数组泛型
``` TS
// 表示arr是number组成的数组
let arr: Array<number> = [1, 2, 3, 4]
```

#### 接口表示
其实数组也是对象，当然可以使用interface
``` TS
interface NumberArray {
  [index: number]: number;
}
let fibonacci: NumberArray = [1, 1, 2, 3, 5];
```

<br />(To be continued...)
