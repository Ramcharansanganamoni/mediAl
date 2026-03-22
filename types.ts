export interface Medicine {
  id: string
  name: string
  dosage: string
  time: string
  createdAt: Date
}

export interface MedicineLog {
  id: string
  medicineId: string
  medicineName: string
  scheduledTime: string
  status: 'taken' | 'missed' | 'snoozed'
  timestamp: Date
}

export interface DailyStats {
  taken: number
  missed: number
  pending: number
  streak: number
}

export interface WeeklyData {
  day: string
  taken: number
  missed: number
}
