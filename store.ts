"use client"

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Medicine, MedicineLog, DailyStats, WeeklyData } from './types'

interface MediTrackerStore {
  medicines: Medicine[]
  logs: MedicineLog[]
  isAuthenticated: boolean
  user: { name: string; email: string } | null
  
  // Auth actions
  login: (email: string, password: string) => boolean
  logout: () => void
  
  // Medicine actions
  addMedicine: (medicine: Omit<Medicine, 'id' | 'createdAt'>) => void
  removeMedicine: (id: string) => void
  updateMedicine: (id: string, medicine: Partial<Medicine>) => void
  
  // Log actions
  logMedicine: (medicineId: string, medicineName: string, scheduledTime: string, status: 'taken' | 'missed' | 'snoozed') => void
  
  // Computed
  getDailyStats: () => DailyStats
  getWeeklyData: () => WeeklyData[]
  getUpcomingReminders: () => Medicine[]
  getStreak: () => number
  getTodayLogs: () => MedicineLog[]
}

const generateId = () => Math.random().toString(36).substring(2, 9)

export const useMediTrackerStore = create<MediTrackerStore>()(
  persist(
    (set, get) => ({
      medicines: [
        { id: '1', name: 'Aspirin', dosage: '100mg', time: '08:00', createdAt: new Date() },
        { id: '2', name: 'Vitamin D', dosage: '1000 IU', time: '09:00', createdAt: new Date() },
        { id: '3', name: 'Metformin', dosage: '500mg', time: '12:00', createdAt: new Date() },
        { id: '4', name: 'Lisinopril', dosage: '10mg', time: '20:00', createdAt: new Date() },
      ],
      logs: [
        { id: '1', medicineId: '1', medicineName: 'Aspirin', scheduledTime: '08:00', status: 'taken', timestamp: new Date(Date.now() - 86400000 * 2) },
        { id: '2', medicineId: '2', medicineName: 'Vitamin D', scheduledTime: '09:00', status: 'taken', timestamp: new Date(Date.now() - 86400000 * 2) },
        { id: '3', medicineId: '3', medicineName: 'Metformin', scheduledTime: '12:00', status: 'missed', timestamp: new Date(Date.now() - 86400000 * 2) },
        { id: '4', medicineId: '1', medicineName: 'Aspirin', scheduledTime: '08:00', status: 'taken', timestamp: new Date(Date.now() - 86400000) },
        { id: '5', medicineId: '2', medicineName: 'Vitamin D', scheduledTime: '09:00', status: 'taken', timestamp: new Date(Date.now() - 86400000) },
        { id: '6', medicineId: '3', medicineName: 'Metformin', scheduledTime: '12:00', status: 'taken', timestamp: new Date(Date.now() - 86400000) },
        { id: '7', medicineId: '4', medicineName: 'Lisinopril', scheduledTime: '20:00', status: 'taken', timestamp: new Date(Date.now() - 86400000) },
      ],
      isAuthenticated: false,
      user: null,

      login: (email: string, password: string) => {
        if (email && password.length >= 4) {
          set({ 
            isAuthenticated: true, 
            user: { name: email.split('@')[0], email } 
          })
          return true
        }
        return false
      },

      logout: () => {
        set({ isAuthenticated: false, user: null })
      },

      addMedicine: (medicine) => {
        const newMedicine: Medicine = {
          ...medicine,
          id: generateId(),
          createdAt: new Date(),
        }
        set((state) => ({ medicines: [...state.medicines, newMedicine] }))
      },

      removeMedicine: (id) => {
        set((state) => ({ 
          medicines: state.medicines.filter((m) => m.id !== id) 
        }))
      },

      updateMedicine: (id, medicine) => {
        set((state) => ({
          medicines: state.medicines.map((m) =>
            m.id === id ? { ...m, ...medicine } : m
          ),
        }))
      },

      logMedicine: (medicineId, medicineName, scheduledTime, status) => {
        const log: MedicineLog = {
          id: generateId(),
          medicineId,
          medicineName,
          scheduledTime,
          status,
          timestamp: new Date(),
        }
        set((state) => ({ logs: [...state.logs, log] }))
      },

      getDailyStats: () => {
        const { logs, medicines } = get()
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        const todayLogs = logs.filter((log) => {
          const logDate = new Date(log.timestamp)
          logDate.setHours(0, 0, 0, 0)
          return logDate.getTime() === today.getTime()
        })

        const taken = todayLogs.filter((l) => l.status === 'taken').length
        const missed = todayLogs.filter((l) => l.status === 'missed').length
        const pending = medicines.length - (taken + missed)
        const streak = get().getStreak()

        return { taken, missed, pending, streak }
      },

      getWeeklyData: () => {
        const { logs } = get()
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        const weekData: WeeklyData[] = []

        for (let i = 6; i >= 0; i--) {
          const date = new Date()
          date.setDate(date.getDate() - i)
          date.setHours(0, 0, 0, 0)
          
          const dayLogs = logs.filter((log) => {
            const logDate = new Date(log.timestamp)
            logDate.setHours(0, 0, 0, 0)
            return logDate.getTime() === date.getTime()
          })

          weekData.push({
            day: days[date.getDay()],
            taken: dayLogs.filter((l) => l.status === 'taken').length,
            missed: dayLogs.filter((l) => l.status === 'missed').length,
          })
        }

        return weekData
      },

      getUpcomingReminders: () => {
        const { medicines, logs } = get()
        const now = new Date()
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
        
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        const todayLogs = logs.filter((log) => {
          const logDate = new Date(log.timestamp)
          logDate.setHours(0, 0, 0, 0)
          return logDate.getTime() === today.getTime()
        })

        return medicines
          .filter((m) => {
            const alreadyLogged = todayLogs.some(
              (l) => l.medicineId === m.id && l.status !== 'snoozed'
            )
            return !alreadyLogged && m.time >= currentTime
          })
          .sort((a, b) => a.time.localeCompare(b.time))
          .slice(0, 5)
      },

      getStreak: () => {
        const { logs, medicines } = get()
        if (medicines.length === 0) return 0
        
        let streak = 0
        const today = new Date()
        
        for (let i = 1; i <= 30; i++) {
          const date = new Date(today)
          date.setDate(date.getDate() - i)
          date.setHours(0, 0, 0, 0)
          
          const dayLogs = logs.filter((log) => {
            const logDate = new Date(log.timestamp)
            logDate.setHours(0, 0, 0, 0)
            return logDate.getTime() === date.getTime()
          })

          const takenCount = dayLogs.filter((l) => l.status === 'taken').length
          const missedCount = dayLogs.filter((l) => l.status === 'missed').length
          
          if (takenCount > 0 && missedCount === 0) {
            streak++
          } else if (dayLogs.length > 0) {
            break
          }
        }
        
        return streak
      },

      getTodayLogs: () => {
        const { logs } = get()
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        return logs.filter((log) => {
          const logDate = new Date(log.timestamp)
          logDate.setHours(0, 0, 0, 0)
          return logDate.getTime() === today.getTime()
        })
      },
    }),
    {
      name: 'meditracker-storage',
    }
  )
)
