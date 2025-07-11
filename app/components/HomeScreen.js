// app/components/HomeScreen.js
"use client"

import { useState, useEffect } from "react"
import {
  Plus,
  Trash2,
  Play,
  Pause,
  BookOpen,
  Workflow,
  ChevronDown,
  ChevronRight,
  Zap,
  Target,
  Rocket,
  DollarSign,
} from "lucide-react"

const HomeScreen = ({
  onNavigateToWorkflow,
  onCreateNew,
  initialSection = "workflows",
  initialPlaybookSection = null,
}) => {
  const [workflows, setWorkflows] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(null)
  const [updatingStatus, setUpdatingStatus] = useState(null)
  const [activeSection, setActiveSection] = useState(initialSection) // Use initialSection
  const [activePlaybookSection, setActivePlaybookSection] = useState(initialPlaybookSection) // Use initialPlaybookSection
  const [showUnsavedModal, setShowUnsavedModal] = useState(false)

  // Define playbook subsections
  const playbookSections = [
    {
      id: "failing-to-close",
      title: "Rep is failing to close deals",
      description:
        "Comprehensive playbooks designed to help sales reps overcome common obstacles in the deal closure process, including objection handling, pricing negotiations, and timing issues.",
      icon: Target,
    },
    {
      id: "deals-drop-off",
      title: "Deals drop off in negotiation",
      description:
        "Strategic approaches to prevent deal abandonment during critical negotiation phases, with focus on maintaining momentum and addressing buyer concerns.",
      icon: Zap,
    },
    {
      id: "not-moving-forward",
      title: "Rep is not moving deals forward in earlier stages",
      description:
        "Tactical workflows to accelerate deal progression through discovery, qualification, and proposal stages with systematic follow-up strategies.",
      icon: Rocket,
    },
    {
      id: "acv-off-whack",
      title: "ACV optimization strategies",
      description:
        "Data-driven approaches to optimize Annual Contract Value through upselling, cross-selling, and strategic pricing adjustments.",
      icon: DollarSign,
    },
  ]

  useEffect(() => {
    loadWorkflows()
  }, [])

  // Update activeSection when initialSection changes
  useEffect(() => {
    setActiveSection(initialSection)
  }, [initialSection])

  // Update activePlaybookSection when initialPlaybookSection changes
  useEffect(() => {
    setActivePlaybookSection(initialPlaybookSection)
  }, [initialPlaybookSection])

  const loadWorkflows = async () => {
    try {
      const response = await fetch("/api/workflows")
      const result = await response.json()

      if (result.workflows) {
        setWorkflows(result.workflows)
      }
    } catch (error) {
      console.error("Error loading workflows:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteWorkflow = async (workflowId, workflowTitle) => {
    if (!confirm(`Are you sure you want to delete "${workflowTitle}"? This action cannot be undone.`)) {
      return
    }

    setIsDeleting(workflowId)

    try {
      const response = await fetch(`/api/workflows/${workflowId}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (result.success) {
        setWorkflows(workflows.filter((w) => w.id !== workflowId))
      } else {
        alert("Error deleting workflow: " + result.error)
      }
    } catch (error) {
      console.error("Delete error:", error)
      alert("Error deleting workflow: " + error.message)
    } finally {
      setIsDeleting(null)
    }
  }

  const handleToggleWorkflowStatus = async (workflowId, currentStatus) => {
    setUpdatingStatus(workflowId)

    try {
      const response = await fetch(`/api/workflows/${workflowId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isRunning: !currentStatus,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setWorkflows(workflows.map((w) => (w.id === workflowId ? { ...w, isRunning: !currentStatus } : w)))
      } else {
        alert("Error updating workflow status: " + result.error)
      }
    } catch (error) {
      console.error("Status update error:", error)
      alert("Error updating workflow status: " + error.message)
    } finally {
      setUpdatingStatus(null)
    }
  }

  const getStepsSummary = (steps) => {
    if (!steps || steps.length === 0) return "No steps"

    const aiSteps = steps.filter((step) => step.executor === "ai").length
    const humanSteps = steps.filter((step) => step.executor === "human").length

    const parts = []
    if (aiSteps > 0) parts.push(`${aiSteps} AI`)
    if (humanSteps > 0) parts.push(`${humanSteps} Human`)

    return parts.join(", ")
  }

  const getPlaybooksForSection = (sectionId) => {
    const playbookWorkflows = workflows.filter((workflow) => workflow.isPlaybookWorkflow === true)
    return playbookWorkflows.filter((workflow) => workflow.playbook === sectionId)
  }

  const getPlaybookCountForSection = (sectionId) => {
    return getPlaybooksForSection(sectionId).length
  }

  const filteredWorkflows = workflows.filter((workflow) => {
    if (activeSection === "playbooks") {
      return workflow.isPlaybookWorkflow === true
    } else {
      return workflow.isPlaybookWorkflow !== true
    }
  })

  const renderWorkflowRow = (workflow, isPlaybookWorkflow = false, playbookSectionId = null) => (
    <tr key={workflow.id} className={`table-row ${isPlaybookWorkflow ? "bg-blue-50" : ""}`}>
      <td className="table-cell">
        <div className="flex items-center space-x-3">
          {/* Status Indicator */}
          <div className={workflow.isRunning ? "status-dot-active" : "status-dot-inactive"} />

          {/* Workflow Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="font-medium text-gray-900 truncate">{workflow.title}</h3>
            </div>
            <div className="text-muted mt-1 line-clamp-2">
              {workflow.steps && workflow.steps.length > 0 && workflow.steps[0].instruction}
            </div>
          </div>
        </div>
      </td>

      <td className="table-cell">
        <span className={workflow.isRunning ? "badge-active" : "badge-inactive"}>
          {workflow.isRunning ? "Active" : "Paused"}
        </span>
      </td>

      <td className="table-cell">
        <span className="text-sm text-gray-600 whitespace-nowrap">{getStepsSummary(workflow.steps)}</span>
      </td>

      <td className="table-cell-right">
        <div className="flex items-center justify-end space-x-actions">
          {/* Run/Pause Button */}
          <button
            onClick={() => handleToggleWorkflowStatus(workflow.id, workflow.isRunning)}
            disabled={updatingStatus === workflow.id}
            className={`btn-sm ${
              updatingStatus === workflow.id
                ? "btn-ghost cursor-not-allowed opacity-50"
                : workflow.isRunning
                  ? "btn-status-active"
                  : "btn-status-inactive"
            }`}
          >
            {updatingStatus === workflow.id ? (
              "Updating..."
            ) : workflow.isRunning ? (
              <>
                <Pause className="w-3 h-3 mr-1" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-3 h-3 mr-1" />
                Run
              </>
            )}
          </button>

          {/* Edit Button */}
          <button
            onClick={() => onNavigateToWorkflow(workflow.id, activeSection, playbookSectionId)}
            className="btn-ghost btn-sm"
          >
            Edit
          </button>

          {/* Delete Button - Now using the preset btn-delete class */}
          {!isPlaybookWorkflow && (
            <button
              onClick={() => handleDeleteWorkflow(workflow.id, workflow.title)}
              disabled={isDeleting === workflow.id}
              className={`btn-delete ${isDeleting === workflow.id ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <Trash2 className="w-3 h-3" />
              <span>{isDeleting === workflow.id ? "Deleting..." : "Delete"}</span>
            </button>
          )}
        </div>
      </td>
    </tr>
  )

  const renderPlaybookSection = (section) => {
    const sectionWorkflows = getPlaybooksForSection(section.id)
    const isActive = activePlaybookSection === section.id
    const workflowCount = getPlaybookCountForSection(section.id)
    const IconComponent = section.icon

    return (
      <div key={section.id} className="card">
        {/* Section Header */}
        <button onClick={() => setActivePlaybookSection(isActive ? null : section.id)} className="accordion-header">
          <div className="accordion-title-group">
            <div className="accordion-icon">
              <IconComponent className="w-4 h-4 text-gray-600" />
            </div>
            <div>
              <h3 className="accordion-title">{section.title}</h3>
              <p className="accordion-subtitle">
                {workflowCount} workflow{workflowCount !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <div className="accordion-chevron">
            {isActive ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </button>

        {/* Section Content */}
        {isActive && (
          <div className="accordion-content">
            {/* Section Description */}
            <div className="accordion-description">
              <p className="accordion-description-text">{section.description}</p>
            </div>

            {/* Workflows Table */}
            {sectionWorkflows.length > 0 ? (
              <div className="table-container">
                <table className="table">
                  <thead className="table-header">
                    <tr>
                      <th className="table-header-cell">Workflow</th>
                      <th className="table-header-cell">Status</th>
                      <th className="table-header-cell">Steps</th>
                      <th className="table-header-cell-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="table-body">
                    {sectionWorkflows.map((workflow) => renderWorkflowRow(workflow, true, section.id))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <Workflow className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-gray-500">No workflows in this playbook yet</p>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  const renderEmptyState = (sectionName) => (
    <div className="empty-state">
      <div className="empty-state-icon">
        {sectionName === "workflows" ? (
          <Workflow className="w-6 h-6 text-gray-400" />
        ) : (
          <BookOpen className="w-6 h-6 text-gray-400" />
        )}
      </div>
      <h3 className="empty-state-title">{sectionName === "workflows" ? "No workflows yet" : "No playbooks yet"}</h3>
      <p className="empty-state-description">
        {sectionName === "workflows"
          ? "Your workflows will appear here when created"
          : "Your playbooks will appear here when created"}
      </p>
    </div>
  )

  const handleModalCancel = () => {
    setShowUnsavedModal(false)
  }

  const handleModalLeave = () => {
    setShowUnsavedModal(false)
    // Additional logic to handle leaving without saving (e.g., navigating away)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="loading-container">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <div className="text-center">
              <p className="loading-text-primary">Loading workflows...</p>
              <p className="loading-text-secondary">Please wait while we fetch your data</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <div className="page-header-inner">
            <div className="relative flex items-center justify-between w-full">
              {/* Left side - Empty for balance */}
              <div className="flex items-center">{/* Empty space for visual balance */}</div>

              {/* Center - Title (absolutely positioned) */}
              <div className="absolute left-1/2 transform -translate-x-1/2">
                <h1 className="heading-secondary">Workflows</h1>
              </div>

              {/* Right side - New workflow button */}
              <div className="flex items-center">
                {activeSection === "workflows" && (
                  <button onClick={onCreateNew} className="btn-primary btn-md btn-icon">
                    <Plus className="w-4 h-4" />
                    New workflow
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="nav-tabs">
        <div className="section-container">
          <nav className="nav-tabs-container">
            <button
              onClick={() => setActiveSection("workflows")}
              className={`nav-tab ${activeSection === "workflows" ? "nav-tab-active" : "nav-tab-inactive"}`}
            >
              Workflows
              <span className="badge-count">{workflows.filter((w) => !w.isPlaybookWorkflow).length}</span>
            </button>
            <button
              onClick={() => setActiveSection("playbooks")}
              className={`nav-tab ${activeSection === "playbooks" ? "nav-tab-active" : "nav-tab-inactive"}`}
            >
              Playbooks
              <span className="badge-count">{workflows.filter((w) => w.isPlaybookWorkflow).length}</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="section-container section-spacing">
        {/* Content */}
        {activeSection === "workflows" ? (
          <div className="card">
            {filteredWorkflows.length === 0 ? (
              renderEmptyState("workflows")
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead className="table-header">
                    <tr>
                      <th className="table-header-cell">Workflow</th>
                      <th className="table-header-cell">Status</th>
                      <th className="table-header-cell">Steps</th>
                      <th className="table-header-cell-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="table-body">
                    {filteredWorkflows.map((workflow) => renderWorkflowRow(workflow, false, null))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">{playbookSections.map((section) => renderPlaybookSection(section))}</div>
        )}
      </div>
    </div>
  )
}

export default HomeScreen
