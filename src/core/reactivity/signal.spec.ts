import { useSignal } from "./signal";
import { toComputed } from "./toComputed";

const x = useSignal(1);
const y = useSignal(2);
const f$ = toComputed((x: number) => x * x);
const g$ = toComputed((x: number) => x * 2);

const result = useSignal(() => f$(x)() + g$(f$(y))());
