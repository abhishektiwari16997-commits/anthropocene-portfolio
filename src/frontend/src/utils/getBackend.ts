import type { Backend } from "../backend";
import { createActorWithConfig } from "../config";

// Lazy singleton anonymous actor for direct backend calls
let _actorPromise: Promise<Backend> | null = null;

export function getBackend(): Promise<Backend> {
  if (!_actorPromise) {
    _actorPromise = createActorWithConfig() as Promise<Backend>;
  }
  return _actorPromise;
}
