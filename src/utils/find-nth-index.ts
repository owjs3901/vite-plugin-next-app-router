export function findNthIndex(str: string, target: string, n: number): number {
  let count = 0
  for (let i = 0; i < str.length; i++) {
    if (str[i] === target) {
      count++
      if (count === n) {
        return i
      }
    }
  }
  return -1 // 찾지 못한 경우
}
