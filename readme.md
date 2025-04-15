#

- \*if
- \*else
- \*for
- \*model

#

:[attr]
:bind
:ref

#

@[event]

#

```
reactive element
const signal = useSignal<T>(value):signalReturn<T>
get value
const res = signal()
set value
signal(someValue)
computed element
const signal = useSignal<T>(()=>T):signalReturn<T>
```
