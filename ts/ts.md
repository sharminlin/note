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
``` JS
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

如上，`something`是一个联合类型的参数，声明函数时是无法知晓调用时的入参是哪种类型（`string` or `number`）。因此在该函数体内，`something`只能访问string和number的共同属性和方法。

