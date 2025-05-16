"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/hooks/auth';

// Define the type for project access
type ProjectAccessRole = 'owner' | 'admin' | 'member' | 'viewer' | null;

// Define the context shape
interface ProjectAccessContextType {
  role: ProjectAccessRole;
  isOwner: boolean;
  isAdmin: boolean;
  isMember: boolean;
  canEdit: boolean;
  canInvite: boolean;
  canDelete: boolean;
  loading: boolean;
  error: string | null;
}

// Create the context with a default value
const ProjectAccessContext = createContext<ProjectAccessContextType>({
  role: null,
  isOwner: false,
  isAdmin: false,
  isMember: false,
  canEdit: false,
  canInvite: false,
  canDelete: false,
  loading: true,
  error: null,
});

// Create a provider component
export function ProjectAccessProvider({ children }: { children: ReactNode }) {
  const params = useParams<{ id: string }>();
  const projectId = params?.id;
  const { user } = useAuth();
  
  const [role, setRole] = useState<ProjectAccessRole>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const checkAccess = async () => {
      if (!projectId || !user) {
        setLoading(false);
        return;
      }
      
      try {
        const response = await fetch(`/api/projects/check-access?projectId=${projectId}&userId=${user.id}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to check project access');
        }
        
        if (data.hasAccess) {
          setRole(data.role);
        } else {
          setRole(null);
          setError('You do not have access to this project');
        }
      } catch (err: any) {
        console.error('Error checking project access:', err);
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    checkAccess();
  }, [projectId, user]);
  
  // Compute derived permissions
  const isOwner = role === 'owner';
  const isAdmin = role === 'admin' || isOwner;
  const isMember = role === 'member' || isAdmin;
  
  // Permission presets
  const canEdit = isOwner || isAdmin || role === 'member';
  const canInvite = isOwner || isAdmin;
  const canDelete = isOwner;
  
  const value = {
    role,
    isOwner,
    isAdmin,
    isMember,
    canEdit,
    canInvite,
    canDelete,
    loading,
    error,
  };
  
  return (
    <ProjectAccessContext.Provider value={value}>
      {children}
    </ProjectAccessContext.Provider>
  );
}

// Create a hook to use the context
export function useProjectAccess() {
  const context = useContext(ProjectAccessContext);
  
  if (context === undefined) {
    throw new Error('useProjectAccess must be used within a ProjectAccessProvider');
  }
  
  return context;
} 