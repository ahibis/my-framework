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
parent useSignal subscribe to signal1, signal2, signal3
child usSignal subscribe to signal3, signal4
since the parent useSignal calls the function every time the subscribed signals change, the child signal will be recreated each time and the subscribers will be re-registered. In this regard, it is worth using this technique as rarely as possible.


```