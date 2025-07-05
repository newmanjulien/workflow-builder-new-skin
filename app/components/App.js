// app/components/App.js
"use client"

import { useState } from "react"
import HomeScreen from "./HomeScreen"
import WorkflowBuilder from "./WorkflowBuilder"

const App = () => {
  const [currentView, setCurrentView] = useState("home")
  const [selectedWorkflowId, setSelectedWorkflowId] = useState(null)
  const [previousSection, setPreviousSection] = useState("workflows") // Track the section to return to

  const handleNavigateToWorkflow = (workflowId, fromSection = "workflows") => {
    setSelectedWorkflowId(workflowId)
    setPreviousSection(fromSection) // Remember which section we came from
    setCurrentView("workflow")
  }

  const handleCreateNew = () => {
    setSelectedWorkflowId(null)
    setPreviousSection("workflows") // New workflows always come from workflows section
    setCurrentView("workflow")
  }

  const handleNavigateBack = () => {
    setCurrentView("home")
    setSelectedWorkflowId(null)
    // previousSection is preserved so HomeScreen can restore the correct section
  }

  if (currentView === "home") {
    return (
      <HomeScreen
        onNavigateToWorkflow={handleNavigateToWorkflow}
        onCreateNew={handleCreateNew}
        initialSection={previousSection} // Pass the section to restore
      />
    )
  }

  return <WorkflowBuilder workflowId={selectedWorkflowId} onNavigateBack={handleNavigateBack} />
}

export default App
