// mimic ctx.throw's error
export class ContextErrorMimic extends Error {
  constructor (status, ...args) {
    super(args)
    this.expose = true
    this.status = status
  }
}
