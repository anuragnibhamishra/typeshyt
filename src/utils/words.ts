import type { TestSettings, WeakKeyStats } from './storage'
import { MIN_WEAK_KEY_ATTEMPTS } from './weakKeys'

export type Mode = 'time' | 'words' | 'code' | 'weak-keys'

const WORDS =
  'the be to of and a in that have it for not on with he as you do at this but his by from they we say her she or an will my one all would there their what so up out if about who get which go me when make can like time no just him know take people into year your good some could them see other than then now look only come its over think also back after use two how our work first well way even new want because any these give day most us quick brown fox jump lazy dog keyboard practice accuracy typing speed letters careful focused daily growth skill steady responsive human input source state function return value map filter reduce array string number object class component render update callback elapsed seconds correct incorrect beginner developer website language browser design layout accessibility'.split(
    ' ',
  )

export interface TextOptions {
  count: number
  settings: TestSettings
  random?: () => number
  weakKeys?: WeakKeyStats
}

export interface GeneratedText {
  text: string
  usedWeakKeyFallback: boolean
}

const CODE_SNIPPETS = [
  { language: 'JavaScript', text: 'const double = (n) => n * 2;' },
  { language: 'TypeScript', text: 'type User = { id: number; name: string };' },
  { language: 'JavaScript', text: 'const items = [1, 2, 3].map((n) => n + 1);' },
  { language: 'TypeScript', text: 'function greet(name: string): string {\\n  return `Hello, ${name}!`;\\n}' },
  { language: 'JavaScript', text: 'if (value === null) {\\n  return false;\\n}' },
  { language: 'TypeScript', text: 'const total = values.reduce((sum, n) => sum + n, 0);' },
  { language: 'Python', text: 'def square(number):\\n    return number ** 2' },
  { language: 'Python', text: 'for item in items:\\n    print(item)' },
  { language: 'Python', text: 'if score >= 10:\\n    print("great")' },
  { language: 'JavaScript', text: 'const user = { name: "Ada", active: true };' },
  { language: 'TypeScript', text: 'const first = list[0] ?? "empty";' },
  { language: 'JavaScript', text: 'const isReady = (x) => x === true;' },
  { language: 'Python', text: 'values = [x * 2 for x in range(5)]' },
  { language: 'TypeScript', text: 'interface Point {\\n  x: number;\\n  y: number;\\n}' },
  { language: 'JavaScript', text: 'try {\\n  save(data);\\n} catch (error) {\\n  log(error);\\n}' },
  { language: 'TypeScript', text: 'const names = users.map(({ name }) => name);' },
  { language: 'Python', text: 'result = {"ok": True, "count": len(items)}' },
  { language: 'JavaScript', text: 'const match = text.match(/[a-z]+/g) || [];' },
]

const NUMBERS = ['0', '1', '2', '3', '7', '10', '42', '100']
const PUNCTUATION = [',', '.', '?']

function randomValue(random: () => number): number {
  const value = random()
  return Number.isFinite(value) ? Math.max(0, Math.min(value, 0.9999999999999999)) : 0
}

function decorateWords(words: string[], settings: TestSettings, random: () => number): string {
  return words
    .map((word, index) => {
      let output = word
      if (settings.punctuation && random() < 0.025) {
        if (word === 'do') output = "don't"
        else if (word === 'can') output = "can't"
        else if (word === 'you') output = "you're"
        else if (word === 'they') output = "they're"
        else if (word === 'its') output = "it's"
      }
      if (settings.numbers && random() < 0.06) {
        output = NUMBERS[Math.floor(randomValue(random) * NUMBERS.length)] ?? output
      }
      if (settings.punctuation && index < words.length - 1 && random() < 0.12) {
        output += PUNCTUATION[Math.floor(randomValue(random) * PUNCTUATION.length)] ?? ''
      }
      return output
    })
    .join(' ')
}

export function generateText(countOrOptions: number | TextOptions = 250): string {
  const options: TextOptions =
    typeof countOrOptions === 'number'
      ? { count: countOrOptions, settings: { punctuation: false, numbers: false } }
      : countOrOptions
  const random = options.random ?? Math.random
  const count = Number.isFinite(options.count) ? Math.max(1, Math.floor(options.count)) : 1
  const weakKeys = options.weakKeys ?? {}
  const targetKeys = Object.entries(weakKeys)
    .filter(([, counter]) => counter.attempts >= MIN_WEAK_KEY_ATTEMPTS && counter.errors > 0)
    .sort((a, b) => b[1].errors / b[1].attempts - a[1].errors / a[1].attempts)
    .slice(0, 8)
    .map(([key, counter]) => [key.toLowerCase(), counter.errors / counter.attempts] as const)

  let words = WORDS
  let wordWeights: number[] | null = null
  if (targetKeys.length) {
    const focused = WORDS.map((word) => {
      const weight = targetKeys.reduce((score, [key, errorRate]) => {
        const occurrences = word.split(key).length - 1
        return score + occurrences * errorRate * 8
      }, 1)
      return { word, weight }
    }).filter(({ weight }) => weight > 1)
    if (focused.length >= 5) {
      words = focused.map(({ word }) => word)
      wordWeights = focused.map(({ weight }) => weight)
    }
  }

  const output: string[] = []
  while (output.length < count) {
    let wordIndex = Math.floor(randomValue(random) * words.length)
    if (wordWeights) {
      const totalWeight = wordWeights.reduce((sum, weight) => sum + weight, 0)
      let selection = randomValue(random) * totalWeight
      wordIndex = wordWeights.findIndex((weight) => {
        selection -= weight
        return selection < 0
      })
      if (wordIndex < 0) wordIndex = words.length - 1
    }
    let word = words[wordIndex]
    if (word === undefined) throw new RangeError('Generated word index is out of range')
    if (word === output[output.length - 1]) {
      wordIndex = (wordIndex + 1) % words.length
      const nextWord = words[wordIndex]
      if (nextWord === undefined) throw new RangeError('Generated word index is out of range')
      word = nextWord
    }
    if (word !== output[output.length - 1]) output.push(word)
  }
  return decorateWords(output, options.settings, random)
}

export function generateWeakPracticeText(
  count: number,
  settings: TestSettings,
  weakKeys: WeakKeyStats,
  random: () => number = Math.random,
): GeneratedText {
  const eligible = Object.values(weakKeys).some(
    (counter) => counter.attempts >= MIN_WEAK_KEY_ATTEMPTS && counter.errors > 0,
  )
  const text = generateText({ count, settings, weakKeys, random })
  return { text, usedWeakKeyFallback: !eligible || !hasWeakWords(weakKeys) }
}

function hasWeakWords(weakKeys: WeakKeyStats): boolean {
  const keys = Object.entries(weakKeys)
    .filter(([, counter]) => counter.attempts >= MIN_WEAK_KEY_ATTEMPTS && counter.errors > 0)
    .map(([key]) => key.toLowerCase())
  return WORDS.filter((word) => keys.some((key) => word.includes(key))).length >= 5
}

export function generateCodeSnippet(
  random: () => number = Math.random,
  previousText?: string,
): { text: string; language: string } {
  let index = Math.floor(randomValue(random) * CODE_SNIPPETS.length)
  let snippet = CODE_SNIPPETS[index]
  if (snippet === undefined) throw new RangeError('Generated code snippet index is out of range')
  let text = snippet.text.replace(/\\n/g, '\n')
  if (text === previousText) {
    index = (index + 1) % CODE_SNIPPETS.length
    snippet = CODE_SNIPPETS[index]
    if (snippet === undefined) throw new RangeError('Generated code snippet index is out of range')
    text = snippet.text.replace(/\\n/g, '\n')
  }
  return { language: snippet.language, text }
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}
