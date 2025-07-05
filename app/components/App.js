// app/components/App.js
"use client"

import { useState } from "react"
import HomeScreen from "./HomeScreen"
import WorkflowBuilder from "./WorkflowBuilder"

const App = () => {
  const [currentView, setCurrentView] = useState("home")
  const [selectedWorkflowId, setSelectedWorkflowId] = useState(null)
  const [previousSection, setPreviousSection] = useState("workflows") // Track the section to return to
  const [previousPlaybookSection, setPreviousPlaybookSection] = useState(null) // Track which playbook accordion was open

  const handleNavigateToWorkflow = (workflowId, fromSection = "workflows", fromPlaybookSection = null) => {
    setSelectedWorkflowId(workflowId)
    setPreviousSection(fromSection) // Remember which section we came from
    setPreviousPlaybookSection(fromPlaybookSection) // Remember which playbook section was open
    setCurrentView("workflow")
  }

  const handleCreateNew = () => {
    setSelectedWorkflowId(null)
    setPreviousSection("workflows") // New workflows always come from workflows section
    setPreviousPlaybookSection(null) // No playbook section for new workflows
    setCurrentView("workflow")
  }

  const handleNavigateBack = () => {
    setCurrentView("home")
    setSelectedWorkflowId(null)
    // previousSection and previousPlaybookSection are preserved so HomeScreen can restore the correct state
  }

  if (currentView === "home") {
    return (
      <HomeScreen
        onNavigateToWorkflow={handleNavigateToWorkflow}
        onCreateNew={handleCreateNew}
        initialSection={previousSection} // Pass the section to restore
        initialPlaybookSection={previousPlaybookSection} // Pass the playbook section to restore
      />
    )
  }

  return <WorkflowBuilder workflowId={selectedWorkflowId} onNavigateBack={handleNavigateBack} />
}

export default App
