// Drug interaction database - common medication interactions
// Note: This is for demonstration purposes only. Always consult healthcare professionals.

export interface DrugInteraction {
  drugs: [string, string]
  severity: "high" | "moderate" | "low"
  description: string
  recommendation: string
}

export const drugInteractions: DrugInteraction[] = [
  {
    drugs: ["aspirin", "ibuprofen"],
    severity: "high",
    description: "Increased risk of gastrointestinal bleeding and reduced cardiovascular protection of aspirin.",
    recommendation: "Avoid taking together. If both are needed, take ibuprofen at least 30 minutes after aspirin.",
  },
  {
    drugs: ["aspirin", "warfarin"],
    severity: "high",
    description: "Significantly increased risk of bleeding when used together.",
    recommendation: "Consult your doctor immediately. Close monitoring required if both are necessary.",
  },
  {
    drugs: ["aspirin", "naproxen"],
    severity: "moderate",
    description: "Both are NSAIDs which can increase stomach irritation and bleeding risk.",
    recommendation: "Avoid taking together unless directed by a healthcare provider.",
  },
  {
    drugs: ["metformin", "alcohol"],
    severity: "high",
    description: "Increased risk of lactic acidosis, a rare but serious side effect.",
    recommendation: "Limit alcohol consumption while taking metformin.",
  },
  {
    drugs: ["lisinopril", "potassium"],
    severity: "moderate",
    description: "ACE inhibitors can increase potassium levels. Additional potassium supplements may cause hyperkalemia.",
    recommendation: "Monitor potassium levels and avoid potassium supplements unless prescribed.",
  },
  {
    drugs: ["lisinopril", "ibuprofen"],
    severity: "moderate",
    description: "NSAIDs can reduce the blood pressure-lowering effect of ACE inhibitors.",
    recommendation: "Use acetaminophen for pain relief instead, or consult your doctor.",
  },
  {
    drugs: ["simvastatin", "grapefruit"],
    severity: "moderate",
    description: "Grapefruit can increase simvastatin levels, raising the risk of muscle damage.",
    recommendation: "Avoid grapefruit and grapefruit juice while taking simvastatin.",
  },
  {
    drugs: ["omeprazole", "clopidogrel"],
    severity: "high",
    description: "Omeprazole can reduce the effectiveness of clopidogrel, increasing heart attack risk.",
    recommendation: "Consider alternative acid reducers. Consult your cardiologist.",
  },
  {
    drugs: ["sertraline", "tramadol"],
    severity: "high",
    description: "Risk of serotonin syndrome, a potentially life-threatening condition.",
    recommendation: "Avoid combination. Seek immediate medical attention if you experience confusion, rapid heartbeat, or fever.",
  },
  {
    drugs: ["amlodipine", "simvastatin"],
    severity: "moderate",
    description: "Amlodipine can increase simvastatin levels, raising the risk of muscle problems.",
    recommendation: "Limit simvastatin dose to 20mg daily when used with amlodipine.",
  },
  {
    drugs: ["metoprolol", "verapamil"],
    severity: "high",
    description: "Both medications slow heart rate and can cause dangerous bradycardia.",
    recommendation: "Avoid combination unless under close medical supervision with ECG monitoring.",
  },
  {
    drugs: ["fluoxetine", "tramadol"],
    severity: "high",
    description: "Risk of serotonin syndrome and increased seizure risk.",
    recommendation: "Avoid combination. Contact your doctor for alternative pain management.",
  },
  {
    drugs: ["gabapentin", "morphine"],
    severity: "high",
    description: "Increased risk of severe drowsiness, respiratory depression, and overdose.",
    recommendation: "Use lowest effective doses. Avoid driving or operating machinery.",
  },
  {
    drugs: ["vitamin d", "calcium"],
    severity: "low",
    description: "Vitamin D enhances calcium absorption, which is generally beneficial.",
    recommendation: "Safe to take together. This is often a recommended combination.",
  },
  {
    drugs: ["iron", "calcium"],
    severity: "moderate",
    description: "Calcium can reduce iron absorption by up to 50%.",
    recommendation: "Take iron and calcium supplements at different times of day (at least 2 hours apart).",
  },
]

// Function to normalize drug names for comparison
function normalizeDrugName(name: string): string {
  return name.toLowerCase().trim()
}

// Check for interactions between a new drug and existing medications
export function checkDrugInteractions(
  newDrug: string,
  existingDrugs: string[]
): DrugInteraction[] {
  const normalizedNewDrug = normalizeDrugName(newDrug)
  const interactions: DrugInteraction[] = []

  for (const existingDrug of existingDrugs) {
    const normalizedExisting = normalizeDrugName(existingDrug)

    for (const interaction of drugInteractions) {
      const [drug1, drug2] = interaction.drugs.map(normalizeDrugName)

      // Check if the new drug and existing drug match either combination
      const matchesForward =
        normalizedNewDrug.includes(drug1) && normalizedExisting.includes(drug2)
      const matchesReverse =
        normalizedNewDrug.includes(drug2) && normalizedExisting.includes(drug1)

      if (matchesForward || matchesReverse) {
        interactions.push(interaction)
      }
    }
  }

  return interactions
}

// Get severity color class
export function getSeverityColor(severity: DrugInteraction["severity"]): string {
  switch (severity) {
    case "high":
      return "text-destructive"
    case "moderate":
      return "text-warning"
    case "low":
      return "text-muted-foreground"
  }
}

// Get severity background class
export function getSeverityBgColor(severity: DrugInteraction["severity"]): string {
  switch (severity) {
    case "high":
      return "bg-destructive/10 border-destructive/20"
    case "moderate":
      return "bg-warning/10 border-warning/20"
    case "low":
      return "bg-muted border-border"
  }
}
