# SQL 学习记录

## 前言
sql学习记录，参考[廖雪峰SQL教程](https://www.liaoxuefeng.com/wiki/001508284671805d39d23243d884b8b99f440bfae87b0f4000 "SQL教程")<br />
emmmm，总结性比较强，划重点，大多引用。许多过于基础的都会略过

## 主键
**定义：**

> 对于关系表，有个很重要的约束，就是任意两条记录不能重复。不能重复不是指两条记录不完全相同，而是指能够通过某个字段唯一区分出不同的记录，这个字段被称为主键。

**注意：**

> 对主键的要求，最关键的一点是：记录一旦插入到表中，主键最好不要再修改，因为主键是用来唯一定位记录的，修改了主键，会造成一系列的影响。

因此，主键最好是与业务完全无关的字段。主键类型分为

> 1. 自增整数类型：数据库会在插入数据时自动为每一条记录分配一个自增整数，这样我们就完全不用担心主键重复，也不用自己预先生成主键
> 2. 全局唯一GUID类型：使用一种全局唯一的字符串作为主键，类似8f55d96b-8acc-4636-8cb8-76bf8abc2f57。GUID算法通过网卡MAC地址、时间戳和随机数保证任意计算机在任意时间生成的字符串都是不同的，大部分编程语言都内置了GUID算法，可以自己预算出主键

## 外键
一个表中的一个外键指向另一个表中的主键，表明表与表之间的对应关系

## 索引
> 索引是关系数据库中对某一列或多个列的值进行预排序的数据结构。通过使用索引，可以让数据库系统不必扫描整个表，而是直接定位到符合条件的记录，这样就大大加快了查询速度。

### 唯一索引
表示表中某一列的值在业务上是唯一的，比如身份证号，银行卡号

## 查询语句

### 基本查询
``` SQL
SELECT * FROM TAB_NAME
```

### 条件查询
``` SQL
SELECT * FROM TAB_NAME WHERE <条件语句>
```

常用逻辑运算符 OR AND NOT BETWWEN IN LIKE，更详细的解释请参考[SQL逻辑运算符](https://www.yiibai.com/sql/sql-logical-operators.html)

常用的表达式符号
``` JS
{
  '=': '等于', 
  '>': '大于', 
  '>=': '大于或等于', 
  '<': '小于', 
  '<=': '小于或等于', 
  '<>': '不等于'
}
```

### 排序 ORDER BY
``` SQL
SELECT field_1 field_2 field_3 FROM TAB_NAME ORDER BY field_1 DESC, field_2
```
表示： 先根据```field_1```倒序，同```field_1```的数据按照```field_2```排序

### 分页查询 LIMIT OFFSET
假设每页需要pageSize条，当前页数为pageIndex
``` SQL
SELECT field_1 field_2 field_3 FROM TAB_NAME 
ORDER BY field_1 DESC, field_2 
LIMIT pageSize OFFSET ((pageindex - 1) * pageSize)
```


### 聚合查询

函数 | 说明
:-: | :-:
COUNT() | 查询所有列的行数
SUM() | 计算某一列的合计值，该列必须为数值类型
AVG() | 计算某一列的平均值，该列必须为数值类型
MAX() | 计算某一列的最大值
MIN() | 计算某一列的最小值


#### 分组聚合 GROUP BY
顾名思义，根据某个或某多个字段进行分组后再聚合，用于根据某个字段或多个字段去重
```SQL
SELECT * from TAB_NAME WHERE field_1 = 20 GROUP BY field_2
```

根据某个字段去重得到数量统计
```SQL
-- 1
SELECT COUNT(1) (SELECT * from TAB_NAME WHERE field_1 = 20 GROUP BY field_2) a

-- 2
SELECT COUNT(DISTINCT field_2) from TAB_NAME WHERE field_1 = 20
```
