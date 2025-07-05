// app/components/App.js
'use client'

import React, { useState } from 'react';
import HomeScreen from './HomeScreen';
import WorkflowBuilder from './WorkflowBuilder';

const App = () => {
  const [currentView, setCurrentView] = useState('home');
  const [selectedWorkflowId, setSelectedWorkflowId] = useState(null);

  const handleNavigateToWorkflow = (workflowId) => {
    setSelectedWorkflowId(workflowId);
    setCurrentView('workflow');
  };

  const handleCreateNew = () => {
    setSelectedWorkflowId(null);
    setCurrentView('workflow');
  };

  const handleNavigateBack = () => {
    setCurrentView('home');
    setSelectedWorkflowId(null);
  };

  if (currentView === 'home') {
    return (
      <HomeScreen
        onNavigateToWorkflow={handleNavigateToWorkflow}
        onCreateNew={handleCreateNew}
      />
    );
  }

  return (
    <WorkflowBuilder
      workflowId={selectedWorkflowId}
      onNavigateBack={handleNavigateBack}
    />
  );
};

export default App;
