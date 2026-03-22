"use client"

import { useEffect, useState, useCallback } from "react"
import { useMediTrackerStore } from "@/lib/store"
import { toast } from "sonner"
import { Bell, Check, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Medicine } from "@/lib/types"

export function ReminderProvider({ children }: { children: React.ReactNode }) {
  const { medicines, logMedicine, getTodayLogs } = useMediTrackerStore()
  const [checkedTimes, setCheckedTimes] = useState<Set<string>>(new Set())

  const speak = useCallback((text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      utterance.pitch = 1
      window.speechSynthesis.speak(utterance)
    }
  }, [])

  const handleTaken = useCallback((medicine: Medicine) => {
    logMedicine(medicine.id, medicine.name, medicine.time, "taken")
    toast.success(`${medicine.name} marked as taken!`, {
      description: "Great job staying on track with your medication.",
    })
  }, [logMedicine])

  const handleSnooze = useCallback((medicine: Medicine) => {
    logMedicine(medicine.id, medicine.name, medicine.time, "snoozed")
    toast.info(`${medicine.name} snoozed for 10 minutes`, {
      description: "We'll remind you again shortly.",
    })
    
    // Re-check after 10 minutes
    setTimeout(() => {
      setCheckedTimes((prev) => {
        const next = new Set(prev)
        next.delete(`${medicine.id}-${medicine.time}`)
        return next
      })
    }, 10 * 60 * 1000)
  }, [logMedicine])

  useEffect(() => {
    const checkReminders = () => {
      const now = new Date()
      const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
      const todayLogs = getTodayLogs()

      medicines.forEach((medicine) => {
        const key = `${medicine.id}-${medicine.time}`
        const alreadyLogged = todayLogs.some(
          (log) => log.medicineId === medicine.id && log.status === "taken"
        )

        if (
          medicine.time === currentTime &&
          !checkedTimes.has(key) &&
          !alreadyLogged
        ) {
          setCheckedTimes((prev) => new Set(prev).add(key))
          
          // Voice alert
          speak(`It is time to take your ${medicine.name}. ${medicine.dosage}.`)

          // Toast notification with actions
          toast(
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Time for {medicine.name}</p>
                  <p className="text-sm text-muted-foreground">{medicine.dosage}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    handleTaken(medicine)
                    toast.dismiss()
                  }}
                >
                  <Check className="w-4 h-4 mr-1" />
                  Taken
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    handleSnooze(medicine)
                    toast.dismiss()
                  }}
                >
                  <Clock className="w-4 h-4 mr-1" />
                  Snooze
                </Button>
              </div>
            </div>,
            {
              duration: 60000,
              closeButton: true,
            }
          )
        }
      })
    }

    // Check immediately
    checkReminders()

    // Check every minute
    const interval = setInterval(checkReminders, 60000)

    return () => clearInterval(interval)
  }, [medicines, checkedTimes, getTodayLogs, speak, handleTaken, handleSnooze])

  return <>{children}</>
}
