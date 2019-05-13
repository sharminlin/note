# context in react

## 概念 Concept
众所周知这是一个dangerous features，非常容易引起组件树间的共享混乱，因此尽量少的去使用它。<br />
context即上下文的意思，在组件树中，子组件可以共享祖先组件定义的context，但祖先组件无法获取子孙组件定义的context<br />
即：一条河，有很多分支，下游的可以拿到上游某个位置扔进来的东西，但上游无法获取下游新扔进来的东西
**context是响应的**

## 如何定义 How to define
定义context满足需要两个条件
1. 定义childContextTypes
```JS
static childContextTypes = {
  uname: PropTypes.string
}
```
2. 使用getChildContext
`getChildContext`是Component内置函数，它返回的就是该组件下的所有子孙组件共享的context，
```JS
getChildContext () {
  return {uname: 'sharmin'}
}
```

## 如何使用 How to use
组件只需要定义contextTypes即可通过this.context访问该对象
```JS
static contextTypes = {
  uname: PropTypes.string
}
```

## 如何改变context某个属性值 How to change
将某个属性(假定为`uname`)指向state，改变state即可响应子孙组件中使用的context.uname

# context in 16.x
在16.x版本以上，facebook对context进行了一个极大的修改，以使其更好的贴近react哲学。当然旧的API也将被兼容，但官方建议最好迁移至新的api。<br />
先看一下官方的例子

``` JS
// 创建一个 theme Context,  默认 theme 的值为 light
const ThemeContext = React.createContext('light');

function ThemedButton(props) {
  // ThemedButton 组件从 context 接收 theme
  return (
    <ThemeContext.Consumer>
      {theme => <Button {...props} theme={theme} />}
    </ThemeContext.Consumer>
  );
}

// 中间组件
function Toolbar(props) {
  return (
    <div>
      <ThemedButton />
    </div>
  );
}

class App extends React.Component {
  render() {
    return (
      <ThemeContext.Provider value="dark">
        <Toolbar />
      </ThemeContext.Provider>
    );
  }
}
```

组件树可以理解为App - Toolbar - ThemedButton<br />
`React.createContext('light')`，即最新api，返回一个对象{ Provider, Consumer }。一个提供者，一个消费者。参数为默认值，可以是任何类型，将被赋值给context。`<Provider value="dark"></Provider>`使用提供者时，传入的value值即为该组件树的context值。

```js
<Consumer>{ (context) => <Button {...this.props} theme={context} /> }</Consumer>
```

`Consumer`使用的了render prop模式。传入的参数即为该消费者所拥有的context。当然可以使用如例子一样语义化的名称`theme`。

## HOW TO CHANGE
那么如何改变context的值呢。同旧API，将`Provider`的value值指向state。<br />
官网的父子耦合时的实现<br />

**theme-context.js**<br />
创建一个context组件对象，包含初始值`theme`和改变该值的一个函数`toggleTheme`
```JS
export const themes = {
  light: {
    foreground: '#000000',
    background: '#eeeeee',
  },
  dark: {
    foreground: '#ffffff',
    background: '#222222',
  },
};
// 确保默认值按类型传递
// createContext() 匹配的属性是 Consumers 所期望的
export const ThemeContext = React.createContext({
  theme: themes.dark,
  toggleTheme: () => {},
});
```

**theme-toggler-button.js**<br />
`Consumer`使用的时候，同上文相同，可传入context的值，这里使用解构赋值`{ theme, toggleTheme }`

```JS
import {ThemeContext} from './theme-context';

function ThemeTogglerButton() {
  // Theme Toggler 按钮不仅接收 theme 属性
  // 也接收了一个来自 context 的 toggleTheme 函数
  return (
    <ThemeContext.Consumer>
      {({theme, toggleTheme}) => (
        <button
          onClick={toggleTheme}
          style={{backgroundColor: theme.background}}>
          Toggle Theme
        </button>
      )}
    </ThemeContext.Consumer>
  );
}

export default ThemeTogglerButton;
```

**app.js**<br />
在使用`Provider`的组件中，在state中定义`theme`和`toggleTheme`，传入`Provider`的value中

```js
import {ThemeContext, themes} from './theme-context';
import ThemeTogglerButton from './theme-toggler-button';

class App extends React.Component {
  constructor(props) {
    super(props);

    this.toggleTheme = () => {
      this.setState(state => ({
        theme:
          state.theme === themes.dark
            ? themes.light
            : themes.dark,
      }));
    };
    // State 包含了 updater 函数 所以它可以传递给底层的 context Provider
    this.state = {
      theme: themes.light,
      toggleTheme: this.toggleTheme,
    };
  }

  render() {
    // 入口 state 传递给 provider
    return (
      <ThemeContext.Provider value={this.state}>
        <Content />
      </ThemeContext.Provider>
    );
  }
}

function Content() {
  return (
    <div>
      <ThemeTogglerButton />
    </div>
  );
}

ReactDOM.render(<App />, document.root);
```