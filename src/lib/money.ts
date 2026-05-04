export function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function divideMoney(value: number, divisor: number) {
  return roundMoney(divisor === 0 ? 0 : value / divisor);
}
