import kleur from 'kleur'

const { stdin } = process

export function useHotKeys(onKeyPress: (key: string) => void) {
  stdin.setRawMode(true)
  stdin.setEncoding('utf8')
  stdin.once('data', (data: any) => {
    if (data == '\x03') {
      console.log('^C')
      process.exit()
    } else {
      onKeyPress(data)
    }
  })
  stdin.resume()
}

export interface HotKeys {
  [key: string]: { desc: string; run: () => void }
}

export function printHotKeys(hotKeys: HotKeys) {
  const lines = Object.keys(hotKeys).map(key =>
    kleur.gray(` › Press ${kleur.white(key)} to ${hotKeys[key].desc}`)
  )
  console.log('\n' + lines.join('\n') + '\n')
}
