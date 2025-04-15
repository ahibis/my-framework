
```markdown
# 🔮 Reactive Front-End Library

A lightweight reactive JavaScript front-end library inspired by **Solid.js** and **Vue**. This framework provides a fine-grained reactivity system and intuitive declarative syntax via directives and lifecycle hooks.

## 📦 Features

- Signals for fine-grained reactivity
- Simple component creation
- Directive-based template bindings
- Lifecycle hooks
- HTML-first design

---

## 🧠 Reactivity

### `useSignal<T>(initial: T | () => T): Signal<T>`

Creates a reactive signal.

```ts
type computedFunc<T> = (recordMode: (isRecord: boolean) => void) => T;
type changeFunc<T> = (value: T) => T;

type Signal<T> = (value?: T | changeFunc<T>) => T;

// Usage
const count = useSignal(0);
console.log(count()); // get
count(5);             // set
count(prev => prev + 1); // update

// Computed
const double = useSignal(() => count() * 2);
```

---

## 🧩 Components

### `createComponent(html: string, setup: (params) => componentContext): ComponentFn`

Defines a component with an HTML template and setup function.

```ts
const MyComponent = createComponent('<div>{{ message }}</div>', ({ message }) => {
  return {};
});

// Usage
MyComponent({ message: 'Hello' }, elements);
```

---

## 🔗 Directives

### Conditional Rendering

#### `*if="value: boolean"`

Renders the element if the condition is `true`.

```html
<div *if="isVisible">Visible content</div>
```

#### `*else`

Used after `*if` to provide an alternative block.

```html
<div *if="isVisible">Shown</div>
<div *else>Hidden</div>
```

---

### List Rendering

#### `*for="item, index in array"`

Loops over an array, rendering the block for each item.

```html
<div *for="item, i in items">{{ item }}</div>
```

Supports signals as sources too:

```html
<div *for="item, i in itemsSignal">Item: {{ item }}</div>
```

---

### Two-Way Binding

#### `*model="value: Signal<T>"`

Binds an input element to a signal.

```html
<input *model="name" />
<p>Hello, {{ name() }}</p>
```

---

## 🎯 Attribute Bindings

### `:[attr]="value"`

Dynamically binds an attribute.

```html
<a :href="url">Link</a>
```

### `:bind="{ attr1: val1, attr2: val2 }"`

Bind multiple attributes dynamically.

```html
<img :bind="{ src: imageUrl, alt: altText }" />
```

---

### Refs

#### `:ref="elementSignal: Signal<HTMLElement>"`

Creates a reference to an element.

```html
<div :ref="boxRef"></div>
<script>
  const boxRef = useSignal(null);
</script>
```

---

### Class Bindings

#### `:class="[class1, class2]"`

Applies multiple classes.

```html
<div :class="['box', isActive ? 'active' : '']"></div>
```

#### `:class="{ class1: cond1, class2: cond2 }"`

Conditionally apply classes.

```html
<div :class="{ active: isActive(), disabled: isDisabled() }"></div>
```

#### `:class="value"`

Use any string or signal value as a class.

```html
<div :class="dynamicClass"></div>
```

---

### Style Bindings

#### `:style="{ prop: value }"`

Applies inline styles from an object.

```html
<div :style="{ color: 'red', fontSize: '20px' }"></div>
```

#### `:style="value"`

Bind a style object or string.

```html
<div :style="styleSignal"></div>
```

---

### HTML Content

#### `:html="value"`

Binds raw HTML content (⚠️ potentially unsafe).

```html
<div :html="rawHtmlContent"></div>
```

---

## 🎉 Event Bindings

### `@[event]="handler"`

Attach event listeners.

```html
<button @click="handleClick">Click me</button>
```

You can also inline code:

```html
<button @click="count(count() + 1)">+</button>
```

---

## 🧬 Special Variables

- `$value`: The current value of a form input element.
- `$event`: The event object from the handler.

```html
<input @input="name($value)" />
<button @click="console.log($event)">Log</button>
```

---

## 🔄 Lifecycle Hooks

### `onMounted(() => void)`

Runs once when the component is mounted.

```ts
onMounted(() => {
  console.log('Component mounted');
});
```

---

## 🛠 Example

```html
<script>
  const name = useSignal('World');
  const visible = useSignal(true);
</script>

<div *if="visible">
  <h1>Hello, {{ name() }}!</h1>
  <input *model="name" />
</div>
<div *else>
  <p>Nothing to see here.</p>
</div>
```

---

## 🔧 Coming Soon

- Transitions
- Slots
- Async components

---

## 📜 License

MIT
```