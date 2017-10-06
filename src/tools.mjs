import config from './config'

export class Logger {
  constructor (name) {
    this.name = name
    this.spaces = (new Array(2+1)).join(' ')
  }

  showPadded (indicator, level) {
    const clams = typeof indicator === 'object' ? util.inspect(indicator) : indicator
    const shell = clams.split(/\r?\n/)
    console[level](this.spaces + shell.join('\n' + this.spaces))
  }

  log (str) {
    console.log(`[${(new Date()).toISOString()}] ${this.name} | ${str}`)
  }

  detail (indicator) {
    if (!config.flags.verbose) return
    this.showPadded(indicator, 'log')
  }

  error (indicator) {
    this.showPadded(indicator, 'error')
  }
}
