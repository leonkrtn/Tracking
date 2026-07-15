// Netto -> Brutto und zurück, gerundet auf Cent.
export function bruttoFromNetto(netto: number, rate: number): number {
  return Math.round(netto * (1 + rate / 100) * 100) / 100
}

export function nettoFromBrutto(brutto: number, rate: number): number {
  return Math.round((brutto / (1 + rate / 100)) * 100) / 100
}

export function vatAmount(brutto: number, rate: number): number {
  return Math.round((brutto - nettoFromBrutto(brutto, rate)) * 100) / 100
}
