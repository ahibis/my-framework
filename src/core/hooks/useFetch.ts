import { useSignal } from "../reactivity";

type fetchParams = Parameters<typeof fetch>;

type FetchOptions<T> = fetchParams[1];

enum Status {
  IDLE,
  LOADING,
  SUCCESS,
  ERROR,
}

function useFetch<T>(url: fetchParams[0], options?: FetchOptions<T>) {
  const result = useSignal<T | undefined>(undefined);
  const status = useSignal(Status.IDLE);
  if (options) {
    if (options.body instanceof Object) {
      options.body = JSON.stringify(options.body);
    }
  }

  const execute = () => {
    status(Status.LOADING);
    fetch(url, options as fetchParams[1]).then((res) => {
      if (res.ok) {
        res.json().then((data) => {
          result(data);
          status(Status.SUCCESS);
        });
      } else {
        status(Status.ERROR);
      }
    });
  };
  execute();
  return {
    execute,
    result,
    status,
  };
}
