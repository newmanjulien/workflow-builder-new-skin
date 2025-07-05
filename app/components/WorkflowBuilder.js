"use client"

import { useState, useEffect } from "react"
import { Plus, Sparkles, User, ArrowLeft, Trash2, ChevronUp, ChevronDown, Check } from "lucide-react"

const WorkflowBuilder = ({ workflowId: initialWorkflowId = null, onNavigateBack }) => {
  const [workflowId, setWorkflowId] = useState(initialWorkflowId)
  const [workflowTitle, setWorkflowTitle] = useState("")
  const [steps, setSteps] = useState([])
  const [isPlaybookWorkflow, setIsPlaybookWorkflow] = useState(false)
  const [playbookDescription, setPlaybookDescription] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showSavedState, setShowSavedState] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showUnsavedModal, setShowUnsavedModal] = useState(false)
  const [showValidationModal, setShowValidationModal] = useState(false)
  const [validationMessage, setValidationMessage] = useState("")

  // Store original data to compare against
  const [originalData, setOriginalData] = useState({
    title: "",
    steps: [],
    isPlaybookWorkflow: false,
    playbookDescription: "",
  })

  // Load existing workflow data on component mount
  useEffect(() => {
    if (initialWorkflowId) {
      loadSpecificWorkflow(initialWorkflowId)
    } else {
      loadLatestWorkflow()
    }
  }, [initialWorkflowId])

  // Track changes for dirty state
  useEffect(() => {
    const currentData = {
      title: workflowTitle,
      steps: steps,
      isPlaybookWorkflow: isPlaybookWorkflow,
      playbookDescription: playbookDescription,
    }

    const hasChanges = JSON.stringify(currentData) !== JSON.stringify(originalData)
    setHasUnsavedChanges(hasChanges)
  }, [workflowTitle, steps, isPlaybookWorkflow, playbookDescription, originalData])

  // Browser beforeunload event for unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ""
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [hasUnsavedChanges])

  const loadSpecificWorkflow = async (id) => {
    try {
      const response = await fetch(`/api/workflows/${id}`)
      const result = await response.json()

      if (result.workflow) {
        const data = {
          title: result.workflow.title,
          steps: result.workflow.steps,
          isPlaybookWorkflow: result.workflow.isPlaybookWorkflow || false,
          playbookDescription: result.workflow.playbook_description || "",
        }

        setWorkflowTitle(data.title)
        setSteps(data.steps)
        setIsPlaybookWorkflow(data.isPlaybookWorkflow)
        setPlaybookDescription(data.playbookDescription)
        setOriginalData(data)
      } else {
        console.error("Workflow not found")
        setDefaultWorkflow()
      }
    } catch (error) {
      console.error("Error loading workflow:", error)
      setDefaultWorkflow()
    } finally {
      setIsLoading(false)
    }
  }

  const loadLatestWorkflow = async () => {
    // For new workflows, always start with default data
    setDefaultWorkflow()
    setIsLoading(false)
  }

  const setDefaultWorkflow = () => {
    const defaultData = {
      title: "My new workflow",
      steps: [
        {
          id: Date.now(),
          instruction: "Add your first step and assign it either to the AI or to a human",
          executor: "ai",
        },
      ],
      isPlaybookWorkflow: false,
      playbookDescription: "",
    }

    setWorkflowTitle(defaultData.title)
    setSteps(defaultData.steps)
    setIsPlaybookWorkflow(defaultData.isPlaybookWorkflow)
    setPlaybookDescription(defaultData.playbookDescription)
    setOriginalData(defaultData)
  }

  const addStep = () => {
    const newStep = {
      id: Date.now(),
      instruction: "",
      executor: "ai",
    }
    setSteps([...steps, newStep])
  }

  const updateStep = (id, field, value) => {
    setSteps(
      steps.map((step) => {
        if (step.id === id) {
          const updatedStep = { ...step, [field]: value }
          // If switching from human to AI, remove the assignedHuman field
          if (field === "executor" && value === "ai") {
            delete updatedStep.assignedHuman
          }
          // If switching to human and no human is assigned, default to first option
          if (field === "executor" && value === "human" && !step.assignedHuman) {
            updatedStep.assignedHuman = "Femi Ibrahim"
          }
          return updatedStep
        }
        return step
      }),
    )
  }

  const deleteStep = (id) => {
    if (steps.length > 1) {
      setSteps(steps.filter((step) => step.id !== id))
    }
  }

  const moveStepUp = (index) => {
    if (index > 0) {
      const newSteps = [...steps]
      const temp = newSteps[index]
      newSteps[index] = newSteps[index - 1]
      newSteps[index - 1] = temp
      setSteps(newSteps)
    }
  }

  const moveStepDown = (index) => {
    if (index < steps.length - 1) {
      const newSteps = [...steps]
      const temp = newSteps[index]
      newSteps[index] = newSteps[index + 1]
      newSteps[index + 1] = temp
      setSteps(newSteps)
    }
  }

  const handleBackClick = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedModal(true)
    } else {
      onNavigateBack()
    }
  }

  const handleModalLeave = () => {
    setShowUnsavedModal(false)
    onNavigateBack()
  }

  const handleModalCancel = () => {
    setShowUnsavedModal(false)
  }

  const handleValidationModalClose = () => {
    setShowValidationModal(false)
    setValidationMessage("")
  }

  const saveWorkflow = async () => {
    // Basic validation
    if (!workflowTitle.trim()) {
      setValidationMessage("Please enter a workflow title")
      setShowValidationModal(true)
      return
    }

    const hasEmptySteps = steps.some((step) => !step.instruction.trim())
    if (hasEmptySteps) {
      setValidationMessage("Please fill in all step instructions")
      setShowValidationModal(true)
      return
    }

    setIsSaving(true)

    try {
      const workflowData = {
        title: workflowTitle,
        steps: steps,
        isPlaybookWorkflow: isPlaybookWorkflow,
        playbook_description: playbookDescription,
        playbook: null,
      }

      let response

      if (workflowId) {
        // Update existing workflow
        response = await fetch(`/api/workflows/${workflowId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(workflowData),
        })
      } else {
        // Create new workflow
        response = await fetch("/api/workflows", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(workflowData),
        })
      }

      const result = await response.json()

      if (result.success) {
        // If this was a new workflow, store the ID for future updates
        if (!workflowId && result.id) {
          setWorkflowId(result.id)
        }

        // Update original data to reflect saved state
        const savedData = {
          title: workflowTitle,
          steps: steps,
          isPlaybookWorkflow: isPlaybookWorkflow,
          playbookDescription: playbookDescription,
        }
        setOriginalData(savedData)

        // Show saved state
        setShowSavedState(true)
        setTimeout(() => {
          setShowSavedState(false)
        }, 2000)

        // If we have a navigation callback and this is a new workflow, navigate back
        if (onNavigateBack && !initialWorkflowId) {
          setTimeout(() => {
            onNavigateBack()
          }, 2500)
        }
      } else {
        setValidationMessage("Error saving workflow: " + result.error)
        setShowValidationModal(true)
      }
    } catch (error) {
      console.error("Save error:", error)
      setValidationMessage("Error saving workflow: " + error.message)
      setShowValidationModal(true)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="loading-container">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <div className="text-center">
              <p className="loading-text-primary">Loading workflow...</p>
              <p className="loading-text-secondary">Please wait while we fetch your data</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Unsaved Changes Modal */}
      {showUnsavedModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h3 className="modal-header">Unsaved Changes</h3>
            <p className="modal-body">
              You have unsaved changes. Are you sure you want to leave? Your changes will be lost.
            </p>
            <div className="modal-footer">
              <button onClick={handleModalCancel} className="btn-secondary btn-md">
                Cancel
              </button>
              <button onClick={handleModalLeave} className="btn-danger btn-md">
                Leave without saving
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Validation Modal */}
      {showValidationModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h3 className="modal-header">Validation Error</h3>
            <p className="modal-body">
              {validationMessage}
            </p>
            <div className="modal-footer">
              <button onClick={handleValidationModalClose} className="btn-primary btn-md">
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <div className="page-header-inner">
            <div className="relative flex items-center justify-between w-full">
              {/* Left side - Back button */}
              <div className="flex items-center">
                {onNavigateBack && (
                  <button
                    onClick={handleBackClick}
                    className="flex items-center space-x-1.5 text-gray-500 hover:text-gray-700 transition-colors duration-200 px-2 py-1 rounded-md hover:bg-gray-100 text-sm"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                )}
              </div>

              {/* Center - Title (absolutely positioned) */}
              <div className="absolute left-1/2 transform -translate-x-1/2">
                <h1 className="heading-secondary">{initialWorkflowId ? "Edit Workflow" : "Create Workflow"}</h1>
              </div>

              {/* Right side - Save button */}
              <div className="flex items-center">
                <button
                  onClick={saveWorkflow}
                  disabled={isSaving || showSavedState}
                  className={`btn-md ${
                    showSavedState ? "btn-saved" : "btn-primary"
                  } ${isSaving || showSavedState ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {isSaving ? (
                    "Saving..."
                  ) : showSavedState ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Saved!
                    </>
                  ) : (
                    "Save Workflow"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 section-spacing">
        {/* Workflow Title */}
        <div className="mb-6">
          <label htmlFor="workflowTitle" className="form-label">
            Workflow Title
          </label>
          <input
            id="workflowTitle"
            type="text"
            value={workflowTitle}
            onChange={(e) => !isPlaybookWorkflow && setWorkflowTitle(e.target.value)}
            placeholder={isPlaybookWorkflow ? "" : "Enter workflow title..."}
            className={`form-input ${isPlaybookWorkflow ? "bg-gray-50 cursor-not-allowed" : ""}`}
            disabled={isPlaybookWorkflow}
          />
        </div>

        {/* Playbook Description (only for playbook workflows) */}
        {isPlaybookWorkflow && playbookDescription && (
          <div className="mb-6 card">
            <div className="card-header">
              <h3 className="heading-secondary">About this workflow</h3>
            </div>
            <div className="card-body">
              <p className="text-gray-700">{playbookDescription}</p>
            </div>
          </div>
        )}

        {/* Steps Section */}
        <div className="card">
          <div className="card-header">
            <div className="flex-between">
              <h3 className="heading-secondary">Workflow Steps</h3>
              <button onClick={addStep} className="btn-primary btn-sm btn-icon-sm">
                <Plus className="w-4 h-4" />
                <span>Add Step</span>
              </button>
            </div>
          </div>

          <div className="card-body">
            <div className="space-y-6">
              {steps.map((step, index) => (
                <div key={step.id} className="relative">
                  {/* Step Number */}
                  <div className="step-layout">
                    <div className="step-number">{index + 1}</div>

                    <div className="step-content">
                      {/* Step Content */}
                      <div className="step-container">
                        {/* Instruction Input */}
                        <textarea
                          value={step.instruction}
                          onChange={(e) => updateStep(step.id, "instruction", e.target.value)}
                          placeholder="Enter step instructions..."
                          className="form-textarea-lg"
                        />

                        {/* Executor and Actions */}
                        <div className="step-actions">
                          <div className="step-executor-group">
                            <span className="text-sm text-gray-500">Executor:</span>
                            <button
                              onClick={() => updateStep(step.id, "executor", "ai")}
                              className={`btn-sm btn-icon-sm ${
                                step.executor === "ai" ? "btn-status-active" : "btn-secondary"
                              }`}
                            >
                              <Sparkles className="w-3 h-3" />
                              <span>AI</span>
                            </button>

                            <button
                              onClick={() => updateStep(step.id, "executor", "human")}
                              className={`btn-sm btn-icon-sm ${
                                step.executor === "human" ? "bg-gray-800 text-white" : "btn-secondary"
                              }`}
                            >
                              <User className="w-3 h-3" />
                              <span>Human</span>
                            </button>
                          </div>

                          <div className="step-controls">
                            {/* Move Step Buttons */}
                            {steps.length > 1 && (
                              <div className="step-move-controls">
                                <button
                                  onClick={() => moveStepUp(index)}
                                  disabled={index === 0}
                                  className="btn-move"
                                  title="Move step up"
                                >
                                  <ChevronUp className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => moveStepDown(index)}
                                  disabled={index === steps.length - 1}
                                  className="btn-move"
                                  title="Move step down"
                                >
                                  <ChevronDown className="w-4 h-4" />
                                </button>
                              </div>
                            )}

                            {/* Delete Button */}
                            {steps.length > 1 && (
                              <button onClick={() => deleteStep(step.id)} className="btn-delete">
                                <Trash2 className="w-3 h-3" />
                                <span>Delete</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Human Assignment */}
                        {step.executor === "human" && (
                          <div className="step-assignment">
                            <label className="form-label-sm">Assign to:</label>
                            <select
                              value={step.assignedHuman || "Femi Ibrahim"}
                              onChange={(e) => updateStep(step.id, "assignedHuman", e.target.value)}
                              className="form-input-sm"
                            >
                              <option value="Femi Ibrahim">Femi Ibrahim</option>
                              <option value="Jason Mao">Jason Mao</option>
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <div className="step-connector">
                      <div className="step-connector-line"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WorkflowBuilder
