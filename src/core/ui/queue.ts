/** A sequencing queue: tasks run one at a time, in order. Errors are isolated per task. */
export type QueueTask = () => void | Promise<void>;

export interface AnimationQueue {
  /** Add a task; resolves when that task has finished. */
  enqueue(task: QueueTask): Promise<void>;
  /** Number of tasks waiting or running. */
  readonly size: number;
  /** Resolves when the queue is empty. */
  idle(): Promise<void>;
  /** Drop pending (not yet started) tasks. */
  clear(): void;
}

export function createAnimationQueue(): AnimationQueue {
  let tail: Promise<void> = Promise.resolve();
  let pending = 0;
  let generation = 0;
  return {
    enqueue(task) {
      pending++;
      const gen = generation;
      const run = tail.then(async () => {
        try {
          if (gen === generation) await task();
        } catch (e) {
          console.error(e);
        } finally {
          pending--;
        }
      });
      tail = run;
      return run;
    },
    get size() {
      return pending;
    },
    idle() {
      return tail;
    },
    clear() {
      generation++;
    },
  };
}
