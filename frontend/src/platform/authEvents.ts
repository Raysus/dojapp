type UnauthorizedListener = () => void;

const listeners = new Set<UnauthorizedListener>();

export function onUnauthorized(listener: UnauthorizedListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitUnauthorized(): void {
  listeners.forEach((listener) => listener());
}
