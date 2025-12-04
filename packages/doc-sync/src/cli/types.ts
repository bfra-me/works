export interface GlobalOptions {
  readonly root: string
  readonly dryRun?: boolean
  readonly verbose?: boolean
  readonly quiet?: boolean
  readonly interactive?: boolean
}

export interface PackageSelectionOption {
  readonly value: string
  readonly label: string
  readonly hint?: string
}

export interface ValidationStatus {
  readonly packageName: string
  readonly isValid: boolean
  readonly issues: readonly string[]
}
