/** Cut-offs used by the automatic criteria. Each carries its basis so it can be reviewed and changed in one place. */
export const THRESHOLDS = {
  /** Male-typical jaw width: bigonial ÷ bizygomatic at or above this. Midpoint of the male (1/1.128 = 0.887) and female (1/1.174 = 0.852) means. */
  jawToCheekMaleTypicalMin: { value: 0.869, source: "Midpoint of male and female means of bizygomatic/bigonial width (1.128 vs 1.174), PMC10335162." },
  /** "Not wide" alar width: alar ÷ intercanthal at or below this (canon: nasal width ≈ intercanthal distance, 5% tolerance). */
  alarToIcdMax: { value: 1.05, source: "Neoclassical canon: nasal width ≈ intercanthal distance, with a 5% tolerance." },
  /** "Projected radix": nasofrontal angle at or below the top of the commonly cited 115–130° range. */
  nasofrontalProjectedMax: { value: 130, source: "Upper bound of the commonly cited 115–130° nasofrontal range; a deeper angle means a more projected radix." },
} as const;
