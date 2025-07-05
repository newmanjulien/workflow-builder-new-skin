"use client"

import { useState, useEffect } from "react"
import { Plus, Sparkles, User, ArrowLeft, Workflow, Trash2 } from "lucide-react"

const WorkflowBuilder = ({ workflowId: initialWorkflowId = null, onNavigateBack }) => {
  const [workflowId, setWorkflowId] = useState(initialWorkflowId)
  const [workflowTitle, setWorkflowTitle] = useState("")
  const [steps, setSteps] = useState([])
  const [isPlaybook, setIsPlaybook] = useState(false)
  const [playbookDescription, setPlaybookDescription] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Load existing workflow data on component mount
  useEffect(() => {
    if (initialWorkflowId) {
      loadSpecificWorkflow(initialWorkflowId)
    } else {
      loadLatestWorkflow()
    }
  }, [initialWorkflowId])

  const loadSpecificWorkflow = async (id) => {
    try {
      const response = await fetch(`/api/workflows/${id}`)
      const result = await response.json()

      if (result.workflow) {
        setWorkflowTitle(result.workflow.title)
        setSteps(result.workflow.steps)
        setIsPlaybook(result.workflow.isPlaybook || false)
        setPlaybookDescription(result.workflow.playbook_description || "")
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
    try {
      const response = await fetch("/api/workflows")
      const result = await response.json()

      if (result.workflows && result.workflows.length > 0) {
        // Load the most recent workflow (first in the array since they're ordered by createdAt desc)
        const latestWorkflow = result.workflows[0]
        setWorkflowId(latestWorkflow.id)
        setWorkflowTitle(latestWorkflow.title)
        setSteps(latestWorkflow.steps)
        setIsPlaybook(latestWorkflow.isPlaybook || false)
        setPlaybookDescription(latestWorkflow.playbook_description || "")
      } else {
        // No existing workflows, set up default data
        setDefaultWorkflow()
      }
    } catch (error) {
      console.error("Error loading workflows:", error)
      setDefaultWorkflow()
    } finally {
      setIsLoading(false)
    }
  }

  const setDefaultWorkflow = () => {
    setWorkflowTitle("After discovery calls")
    setSteps([
      {
        id: Date.now(),
        instruction:
          "At 8pm, pull all the Gong recordings from the rep's discovery calls that day. Filter to only deals which have a next step set in Salesforce",
        executor: "ai",
      },
    ])
    setIsPlaybook(false)
    setPlaybookDescription("")
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

  const saveWorkflow = async () => {
    // Don't allow saving playbooks
    if (isPlaybook) {
      alert("Playbooks cannot be edited through this interface")
      return
    }

    // Basic validation
    if (!workflowTitle.trim()) {
      alert("Please enter a workflow title")
      return
    }

    const hasEmptySteps = steps.some((step) => !step.instruction.trim())
    if (hasEmptySteps) {
      alert("Please fill in all step instructions")
      return
    }

    setIsSaving(true)

    try {
      const workflowData = {
        title: workflowTitle,
        steps: steps,
        isPlaybook: false, // Always false for user-created workflows
        playbook_description: "",
        playbookSection: null,
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
        alert("Workflow saved successfully!")

        // If we have a navigation callback and this is a new workflow, navigate back
        if (onNavigateBack && !initialWorkflowId) {
          setTimeout(() => {
            onNavigateBack()
          }, 1000)
        }
      } else {
        alert("Error saving workflow: " + result.error)
      }
    } catch (error) {
      console.error("Save error:", error)
      alert("Error saving workflow: " + error.message)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="loading-container">
          <div className="loading-content">
            <div className="loading-icon-container">
              <div className="loading-spinner"></div>
              <div className="loading-icon">
                <Workflow className="w-5 h-5 text-green-600" />
              </div>
            </div>
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
      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <div className="page-header-inner">
            <div className="relative flex items-center justify-between w-full">
              {/* Left side - Back button */}
              <div className="flex items-center">
                {onNavigateBack && (
                  <button onClick={onNavigateBack} className="nav-back-button">
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                )}
              </div>

              {/* Center - Title (absolutely positioned) */}
              <div className="absolute left-1/2 transform -translate-x-1/2">
                <h1 className="heading-primary">
                  {isPlaybook ? "View Playbook" : workflowId ? "Edit Workflow" : "Create Workflow"}
                </h1>
              </div>

              {/* Right side - Save button (only for workflows) */}
              <div className="flex items-center">
                {!isPlaybook && (
                  <button
                    onClick={saveWorkflow}
                    disabled={isSaving}
                    className={`btn-primary btn-md ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {isSaving ? "Saving..." : workflowId ? "Update Workflow" : "Save Workflow"}
                  </button>
                )}
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
            {isPlaybook ? "Playbook Title" : "Workflow Title"}
          </label>
          <input
            id="workflowTitle"
            type="text"
            value={workflowTitle}
            onChange={(e) => !isPlaybook && setWorkflowTitle(e.target.value)}
            placeholder={isPlaybook ? "" : "Enter workflow title..."}
            className={`form-input ${isPlaybook ? "bg-gray-50 cursor-not-allowed" : ""}`}
            disabled={isPlaybook}
          />
        </div>

        {/* Playbook Description (only for playbooks) */}
        {isPlaybook && playbookDescription && (
          <div className="mb-6 card">
            <div className="card-header">
              <h3 className="heading-secondary">Description</h3>
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
              <h3 className="heading-secondary">{isPlaybook ? "Playbook Steps" : "Workflow Steps"}</h3>
              {!isPlaybook && (
                <button onClick={addStep} className="btn-primary btn-sm btn-icon-sm">
                  <Plus className="w-4 h-4" />
                  <span>Add Step</span>
                </button>
              )}
            </div>
          </div>

          <div className="card-body">
            <div className="space-y-6">
              {steps.map((step, index) => (
                <div key={step.id} className="relative">
                  {/* Step Number */}
                  <div className="flex items-start space-x-4">
                    <div className="step-number">{index + 1}</div>

                    <div className="flex-1">
                      {/* Step Content */}
                      <div className="step-container">
                        {/* Instruction Input */}
                        <textarea
                          value={step.instruction}
                          onChange={(e) => !isPlaybook && updateStep(step.id, "instruction", e.target.value)}
                          placeholder={isPlaybook ? "" : "Enter step instructions..."}
                          className={`form-textarea-lg ${isPlaybook ? "bg-gray-50 cursor-not-allowed" : ""}`}
                          disabled={isPlaybook}
                        />

                        {/* Executor and Actions */}
                        <div className="mt-4 flex-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500">Executor:</span>
                            <button
                              onClick={() => !isPlaybook && updateStep(step.id, "executor", "ai")}
                              className={`btn-sm btn-icon-sm ${
                                step.executor === "ai" ? "btn-status-active" : "btn-secondary"
                              } ${isPlaybook ? "cursor-not-allowed opacity-75" : ""}`}
                              disabled={isPlaybook}
                            >
                              <Sparkles className="w-3 h-3" />
                              <span>AI</span>
                            </button>

                            <button
                              onClick={() => !isPlaybook && updateStep(step.id, "executor", "human")}
                              className={`btn-sm btn-icon-sm ${
                                step.executor === "human" ? "bg-gray-800 text-white" : "btn-secondary"
                              } ${isPlaybook ? "cursor-not-allowed opacity-75" : ""}`}
                              disabled={isPlaybook}
                            >
                              <User className="w-3 h-3" />
                              <span>Human</span>
                            </button>
                          </div>

                          {/* Delete Button (only for workflows) */}
                          {!isPlaybook && steps.length > 1 && (
                            <button
                              onClick={() => deleteStep(step.id)}
                              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 hover:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Delete</span>
                            </button>
                          )}
                        </div>

                        {/* Human Assignment */}
                        {step.executor === "human" && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <label className="form-label-sm">Assign to:</label>
                            <select
                              value={step.assignedHuman || "Femi Ibrahim"}
                              onChange={(e) => !isPlaybook && updateStep(step.id, "assignedHuman", e.target.value)}
                              className={`form-input-sm ${isPlaybook ? "bg-gray-50 cursor-not-allowed" : ""}`}
                              disabled={isPlaybook}
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
                    <div className="flex justify-start ml-3.5 py-3">
                      <div className="w-px h-4 bg-gray-300"></div>
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
