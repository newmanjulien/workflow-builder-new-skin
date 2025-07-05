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

const HomeScreen = ({ onNavigateToWorkflow, onCreateNew }) => {
  const [workflows, setWorkflows] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(null)
  const [updatingStatus, setUpdatingStatus] = useState(null)
  const [activeSection, setActiveSection] = useState("workflows")
  const [activePlaybookSection, setActivePlaybookSection] = useState(null)

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
    const playbooks = workflows.filter((workflow) => workflow.isPlaybook === true)
    return playbooks.filter((playbook) => playbook.playbookSection === sectionId)
  }

  const getPlaybookCountForSection = (sectionId) => {
    return getPlaybooksForSection(sectionId).length
  }

  const filteredWorkflows = workflows.filter((workflow) => {
    if (activeSection === "playbooks") {
      return workflow.isPlaybook === true
    } else {
      return workflow.isPlaybook !== true
    }
  })

  const renderWorkflowRow = (workflow, isPlaybook = false) => (
    <tr key={workflow.id} className="table-row">
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
              {isPlaybook && workflow.playbook_description
                ? workflow.playbook_description
                : workflow.steps && workflow.steps.length > 0 && workflow.steps[0].instruction}
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
        <span className="text-sm text-gray-600">{getStepsSummary(workflow.steps)}</span>
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
          <button onClick={() => onNavigateToWorkflow(workflow.id)} className="btn-ghost btn-sm">
            {isPlaybook ? "View" : "Edit"}
          </button>

          {/* Delete Button */}
          {!isPlaybook && (
            <button
              onClick={() => handleDeleteWorkflow(workflow.id, workflow.title)}
              disabled={isDeleting === workflow.id}
              className={`btn-sm ${
                isDeleting === workflow.id ? "btn-ghost cursor-not-allowed opacity-50" : "text-red-600 hover:bg-red-50"
              }`}
            >
              <Trash2 className="w-3 h-3 mr-1" />
              {isDeleting === workflow.id ? "Deleting..." : "Delete"}
            </button>
          )}
        </div>
      </td>
    </tr>
  )

  const renderPlaybookSection = (section) => {
    const sectionPlaybooks = getPlaybooksForSection(section.id)
    const isActive = activePlaybookSection === section.id
    const playbookCount = getPlaybookCountForSection(section.id)
    const IconComponent = section.icon

    return (
      <div key={section.id} className="card">
        {/* Section Header */}
        <button
          onClick={() => setActivePlaybookSection(isActive ? null : section.id)}
          className="w-full px-6 py-4 flex-between hover:bg-gray-50 transition-colors text-left"
        >
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <IconComponent className="w-4 h-4 text-gray-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{section.title}</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                {playbookCount} playbook{playbookCount !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <div className="flex-shrink-0">
            {isActive ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </button>

        {/* Section Content */}
        {isActive && (
          <div className="border-t border-gray-200">
            {/* Section Description */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <p className="text-sm text-gray-600">{section.description}</p>
            </div>

            {/* Playbooks Table */}
            {sectionPlaybooks.length > 0 ? (
              <div className="table-container">
                <table className="table">
                  <thead className="table-header">
                    <tr>
                      <th className="table-header-cell">Playbook</th>
                      <th className="table-header-cell">Status</th>
                      <th className="table-header-cell">Steps</th>
                      <th className="table-header-cell-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="table-body">
                    {sectionPlaybooks.map((playbook) => renderWorkflowRow(playbook, true))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <BookOpen className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-gray-500">No playbooks in this section yet</p>
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
      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <div className="page-header-inner">
            <div className="relative flex items-center justify-between w-full">
              {/* Left side - Empty for balance */}
              <div className="flex items-center">{/* Empty space for visual balance */}</div>

              {/* Center - Title (absolutely positioned) */}
              <div className="absolute left-1/2 transform -translate-x-1/2">
                <h1 className="heading-primary">Workflows</h1>
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
              <span className="badge-count">{workflows.filter((w) => !w.isPlaybook).length}</span>
            </button>
            <button
              onClick={() => setActiveSection("playbooks")}
              className={`nav-tab ${activeSection === "playbooks" ? "nav-tab-active" : "nav-tab-inactive"}`}
            >
              Playbooks
              <span className="badge-count">{workflows.filter((w) => w.isPlaybook).length}</span>
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
                    {filteredWorkflows.map((workflow) => renderWorkflowRow(workflow, false))}
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
