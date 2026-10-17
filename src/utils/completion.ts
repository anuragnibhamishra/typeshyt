export function shouldFinishTimedTest(elapsedSec: number, duration: number): boolean {
  return elapsedSec >= duration
}

export function shouldFinishTextTest(typedLength: number, textLength: number): boolean {
  return typedLength >= textLength
}
