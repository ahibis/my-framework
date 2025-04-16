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
// Watch
useSignal(() => count() * 2);
```

how work usSignal in computed mode
```ts

useSignal(()=>{
  signal1()
  signal2()
  reactive1.value
})
track all calling signals and reactive values.
useSignal(()=>{
  signal1()
  signal2()
  useSignal(()=>{
    signal3()
    signal4()
  })
  signal5()
}
```
parent useSignal subscribe to signal1, signal2, signal3
child usSignal subscribe to signal3, signal4

```ts
const name = useSignal("Bob");
const secondName = usSignal("Bob")
const fullname = useSignal(()=>name()+secondName());
```
```html
<div>{fullname()}</div>
<div>{fullname()+" hi"}</div>
<div>{fullname()+" hello"}</div>
```
so if you don't wrap fullname in useSignal, the next fullname() will be called 3 times when changing the name, otherwise 1.

don't make this
```ts
const b = useSignal(()=>{
  console.log("a")
  const a = useSignal(()=>{
    console.log("b");
    return name()
  })
  a()
})
```
