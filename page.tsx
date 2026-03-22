"use client"

import { useState, useEffect, useMemo } from "react"
import { Plus, Pill, Clock, Trash2, Edit2, Check, X, AlertTriangle, ShieldAlert, Info } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useMediTrackerStore } from "@/lib/store"
import { toast } from "sonner"
import type { Medicine } from "@/lib/types"
import { checkDrugInteractions, getSeverityBgColor, getSeverityColor, type DrugInteraction } from "@/lib/drug-interactions"

export default function MedicinesPage() {
  const { medicines, addMedicine, removeMedicine, updateMedicine, logMedicine, getTodayLogs } = useMediTrackerStore()
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: "", dosage: "", time: "" })
  const [newMedicine, setNewMedicine] = useState({ name: "", dosage: "", time: "" })
  const [mounted, setMounted] = useState(false)
  const [todayLogs, setTodayLogs] = useState<Array<{ medicineId: string; status: string }>>([])
  const [interactions, setInteractions] = useState<DrugInteraction[]>([])
  const [acknowledgedInteractions, setAcknowledgedInteractions] = useState(false)

  useEffect(() => {
    setMounted(true)
    setTodayLogs(getTodayLogs())
  }, [getTodayLogs])

  // Check for drug interactions when new medicine name changes
  useEffect(() => {
    if (newMedicine.name.length >= 2) {
      const existingDrugNames = medicines.map((m) => m.name)
      const foundInteractions = checkDrugInteractions(newMedicine.name, existingDrugNames)
      setInteractions(foundInteractions)
      setAcknowledgedInteractions(false)
    } else {
      setInteractions([])
    }
  }, [newMedicine.name, medicines])

  const handleAddMedicine = () => {
    if (!newMedicine.name || !newMedicine.dosage || !newMedicine.time) {
      toast.error("Please fill in all fields")
      return
    }
    
    // Check for high-severity interactions that haven't been acknowledged
    const highSeverityInteractions = interactions.filter((i) => i.severity === "high")
    if (highSeverityInteractions.length > 0 && !acknowledgedInteractions) {
      toast.error("Please acknowledge the drug interaction warnings before adding this medication")
      return
    }
    
    addMedicine(newMedicine)
    setNewMedicine({ name: "", dosage: "", time: "" })
    setInteractions([])
    setAcknowledgedInteractions(false)
    setIsAddOpen(false)
    
    if (interactions.length > 0) {
      toast.success("Medicine added. Remember to consult your doctor about potential interactions.")
    } else {
      toast.success("Medicine added successfully")
    }
  }

  const handleDelete = (id: string, name: string) => {
    removeMedicine(id)
    toast.success(`${name} removed from your medications`)
  }

  const startEditing = (medicine: Medicine) => {
    setEditingId(medicine.id)
    setEditForm({ name: medicine.name, dosage: medicine.dosage, time: medicine.time })
  }

  const saveEdit = (id: string) => {
    if (!editForm.name || !editForm.dosage || !editForm.time) {
      toast.error("Please fill in all fields")
      return
    }
    updateMedicine(id, editForm)
    setEditingId(null)
    toast.success("Medicine updated successfully")
  }

  const handleQuickTake = (medicine: Medicine) => {
    logMedicine(medicine.id, medicine.name, medicine.time, "taken")
    setTodayLogs(getTodayLogs())
    toast.success(`${medicine.name} marked as taken`)
  }

  const isTakenToday = (medicineId: string) => {
    return todayLogs.some((log) => log.medicineId === medicineId && log.status === "taken")
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Medicines</h1>
          <p className="text-muted-foreground mt-1">
            Manage your medication schedule
          </p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Add Medicine
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Add New Medicine</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Add a new medication to your schedule
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Medicine Name</label>
                <Input
                  placeholder="e.g., Aspirin"
                  value={newMedicine.name}
                  onChange={(e) => setNewMedicine({ ...newMedicine, name: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Dosage</label>
                <Input
                  placeholder="e.g., 100mg"
                  value={newMedicine.dosage}
                  onChange={(e) => setNewMedicine({ ...newMedicine, dosage: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Time (HH:MM)</label>
                <Input
                  type="time"
                  value={newMedicine.time}
                  onChange={(e) => setNewMedicine({ ...newMedicine, time: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
              
              {/* Drug Interaction Warnings */}
              {interactions.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <ShieldAlert className="w-4 h-4 text-warning" />
                    Drug Interaction Alert
                  </div>
                  {interactions.map((interaction, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${getSeverityBgColor(interaction.severity)}`}
                    >
                      <div className="flex items-start gap-2">
                        {interaction.severity === "high" ? (
                          <AlertTriangle className={`w-4 h-4 mt-0.5 ${getSeverityColor(interaction.severity)}`} />
                        ) : (
                          <Info className={`w-4 h-4 mt-0.5 ${getSeverityColor(interaction.severity)}`} />
                        )}
                        <div className="space-y-1 flex-1">
                          <p className={`text-sm font-medium ${getSeverityColor(interaction.severity)}`}>
                            {interaction.severity === "high" ? "High" : interaction.severity === "moderate" ? "Moderate" : "Low"} Severity
                          </p>
                          <p className="text-sm text-foreground">{interaction.description}</p>
                          <p className="text-xs text-muted-foreground">{interaction.recommendation}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {interactions.some((i) => i.severity === "high") && (
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={acknowledgedInteractions}
                        onChange={(e) => setAcknowledgedInteractions(e.target.checked)}
                        className="w-4 h-4 rounded border-border"
                      />
                      <span className="text-muted-foreground">
                        I understand the risks and will consult my doctor
                      </span>
                    </label>
                  )}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddMedicine} className="bg-primary text-primary-foreground">
                Add Medicine
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Medicines List */}
      <div className="grid gap-4">
        {medicines.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Pill className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium text-foreground">No medicines added</p>
              <p className="text-muted-foreground text-center mt-1">
                Add your first medication to start tracking
              </p>
              <Button 
                className="mt-4 bg-primary text-primary-foreground"
                onClick={() => setIsAddOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Medicine
              </Button>
            </CardContent>
          </Card>
        ) : (
          medicines.map((medicine) => (
            <Card key={medicine.id} className="bg-card border-border">
              <CardContent className="p-0">
                {editingId === medicine.id ? (
                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <Input
                        placeholder="Medicine Name"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="bg-secondary border-border"
                      />
                      <Input
                        placeholder="Dosage"
                        value={editForm.dosage}
                        onChange={(e) => setEditForm({ ...editForm, dosage: e.target.value })}
                        className="bg-secondary border-border"
                      />
                      <Input
                        type="time"
                        value={editForm.time}
                        onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
                        className="bg-secondary border-border"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingId(null)}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => saveEdit(medicine.id)}
                        className="bg-primary text-primary-foreground"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        isTakenToday(medicine.id) 
                          ? "bg-success/10" 
                          : "bg-primary/10"
                      }`}>
                        {isTakenToday(medicine.id) ? (
                          <Check className="w-6 h-6 text-success" />
                        ) : (
                          <Pill className="w-6 h-6 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{medicine.name}</p>
                        <p className="text-sm text-muted-foreground">{medicine.dosage}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm font-medium">{medicine.time}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {!isTakenToday(medicine.id) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleQuickTake(medicine)}
                            className="text-success hover:text-success hover:bg-success/10"
                          >
                            <Check className="w-4 h-4" />
                            <span className="sr-only sm:not-sr-only sm:ml-1">Take</span>
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEditing(medicine)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Edit2 className="w-4 h-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(medicine.id, medicine.name)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Quick Tips */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Tips for Better Adherence</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary">1.</span>
              Set medications at consistent times each day
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">2.</span>
              Keep your medications in a visible location
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">3.</span>
              Use the voice reminders feature for important medications
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">4.</span>
              Review your medication history regularly
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
