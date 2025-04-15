#

- \*if="value:boolean"
- \*else
- \*for="value,key in array"
  for="value:Signal<T>,key:number in array:T[]"
- \*model="value:Signal<T>"

#

:[attr]="value:T"
:bind="{attrName:value1, attrName:value2, ...}: Record<string, unknown>"
:ref="signalElement:Signal<HTMLElement>"
:class="[class1, class2, ...]:string[]"
:class="{class1:condition, class2:condition}:Record<string,boolean>"
:class="value:T"
:style="{style1:value1, style2:value2}:Record<string, string>"
:style="value:T"
:html="value:string"
#

@[event]="func:(e:Event)=>void"
@[event]="code:text"
$value - 
$event -

# life sickle hooks
onMounted(()=>{})


# component
function createComponent<T extends object>(htmlString: string, setup: (params: T) => componentContext): (params: T, elements: Record<string, NodeList>) => ShadowRoot


## useSignal

```typescript
type computedFunc<T> = (recordMode: (isRecord: boolean) => void) => T;
type changeFunc<T> = (value: T) => T;
type Signal<T> = (value1?: T | changeFunc<T>) => T;
//reactive element
function useSignal<T>(value: T | computedFunc<T>): Signal<T>;


const signal = useSignal<T>(value):Signal<T>
get value
const res = signal()
set value
signal(someValue)
computed element
const signal = useSignal<T>(()=>T):Signal<T>
```
