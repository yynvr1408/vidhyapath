// Academic Context: Intelligent Syllabus Fetching & Curriculum Management
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Subject, CurriculumTopic } from '../types/enterprise';
import { useEnterpriseAuth } from './EnterpriseAuthContext';

interface AcademicContextValue {
  subjects: Subject[];
  activeSubject: Subject | null;
  completedTopicIds: string[];
  loading: boolean;
  setActiveSubject: (subject: Subject | null) => void;
  selectSubjectById: (subjectId: string) => void;
  toggleTopicCompletion: (topicId: string) => Promise<void>;
  refreshSyllabus: () => Promise<void>;
  publishNewSyllabus: (draft: any) => Promise<{ success: boolean; message?: string }>;
}

const AcademicContext = createContext<AcademicContextValue | null>(null);

export const AcademicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token } = useEnterpriseAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [activeSubject, setActiveSubject] = useState<Subject | null>(null);
  const [completedTopicIds, setCompletedTopicIds] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchSyllabus = async () => {
    setLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/academic/student-syllabus', { headers });
      if (res.ok) {
        const data = await res.json();
        setSubjects(data.subjects || []);
        if (data.completedTopicIds) {
          setCompletedTopicIds(data.completedTopicIds);
        }
        if (data.subjects && data.subjects.length > 0 && !activeSubject) {
          setActiveSubject(data.subjects[0]);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch academic syllabus:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSyllabus();
  }, [user?.id, token]);

  const selectSubjectById = (subjectId: string) => {
    const found = subjects.find((s) => s.id === subjectId);
    if (found) {
      setActiveSubject(found);
    }
  };

  const toggleTopicCompletion = async (topicId: string) => {
    // Optimistic UI update
    const isCompleted = completedTopicIds.includes(topicId);
    const updated = isCompleted
      ? completedTopicIds.filter((id) => id !== topicId)
      : [...completedTopicIds, topicId];

    setCompletedTopicIds(updated);

    try {
      if (token) {
        await fetch(`/api/lms/topics/${topicId}/toggle-complete`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (err) {
      console.warn('Could not sync topic completion to server:', err);
    }
  };

  const publishNewSyllabus = async (draft: any) => {
    try {
      const res = await fetch('/api/academic/syllabus/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ draft }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchSyllabus();
        return { success: true, message: data.message };
      }
      return { success: false, message: data.error || 'Failed to publish syllabus' };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  };

  return (
    <AcademicContext.Provider
      value={{
        subjects,
        activeSubject,
        completedTopicIds,
        loading,
        setActiveSubject,
        selectSubjectById,
        toggleTopicCompletion,
        refreshSyllabus: fetchSyllabus,
        publishNewSyllabus,
      }}
    >
      {children}
    </AcademicContext.Provider>
  );
};

export const useAcademic = () => {
  const ctx = useContext(AcademicContext);
  if (!ctx) throw new Error('useAcademic must be used within AcademicProvider');
  return ctx;
};
