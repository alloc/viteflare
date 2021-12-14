import kleur from 'kleur'

export function log(msg: string, ...args: any[]) {
  console.log(kleur.bold(kleur.white('[viteflare]')) + ' ' + msg, ...args)
}
