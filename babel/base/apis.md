# babel 工具包

官方文档：https://babeljs.io/docs/babel-parser

官方插件手册：https://github.com/jamiebuilds/babel-handbook/blob/master/translations/zh-Hans/plugin-handbook.md#toc-transform

## 1. @babel/parser

`@babel/parser` 是一个用来解析代码的包，它把代码解析成 AST。

## 2. @babel/traverse

`@babel/traverse` 是一个用来遍历 AST 的包，它提供了一系列的 API，用于对 AST 进行操作。

## 3. @babel/types

This module contains methods for building ASTs manually and for checking the types of AST nodes.


## 4. @babel/template

`@babel/template` 是一个用来生成 AST 的模板引擎，它提供了一系列的 API，用于生成 AST。

## 5. @babel/generator

`@babel/generator` 是一个用来生成代码的包，它把 AST 转换成代码。

## 6. @babel/code-frame

`@babel/code-frame` 是一个用来生成代码片段的包，它把错误信息转换成代码片段，从而定位问题。

## 7. @babel/core

babel 基于以上的包来实现编译、插件、预设等功能
