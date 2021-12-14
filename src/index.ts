export interface Worker {
  fetch?(request, bindings, context): any
  scheduled?(controller, bindings, context): any
}

export function defineWorker(worker: Worker) {
  return worker
}
