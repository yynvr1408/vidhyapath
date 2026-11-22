// Syllabus Upload, Parsing & Structured Academic Extraction Service
import { Subject, CurriculumUnit, CurriculumTopic } from '../types/enterprise.js';
import { dataStore } from '../db/store.js';

export interface ExtractedSyllabusDraft {
  subjectName: string;
  subjectCode: string;
  credits: number;
  programmeId: string;
  semester: number;
  syllabusVersion: string;
  units: {
    unitNumber: number;
    title: string;
    description: string;
    topics: {
      topicNumber: number;
      title: string;
      description: string;
      learningOutcomes: string[];
      referenceMaterials: string[];
    }[];
  }[];
}

export class SyllabusProcessorService {
  // Parse raw text or structured document into academic curriculum hierarchy
  static processSyllabusText(
    text: string,
    meta: {
      institutionId: string;
      departmentId: string;
      programmeId: string;
      semester: number;
      syllabusVersion?: string;
    }
  ): ExtractedSyllabusDraft {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

    let subjectName = 'Extracted Subject';
    let subjectCode = 'SUB101';
    let credits = 3;

    // Detect subject header
    for (const line of lines) {
      const codeMatch = line.match(/(?:course|subject)?\s*(?:code)?\s*[:\-]?\s*([A-Z]{2,4}\s*\d{3,4})/i);
      if (codeMatch) {
        subjectCode = codeMatch[1].replace(/\s+/g, '').toUpperCase();
      }
      const titleMatch = line.match(/(?:subject|course|title)\s*[:\-]\s*(.+)/i);
      if (titleMatch) {
        subjectName = titleMatch[1].trim();
      }
      const creditsMatch = line.match(/(?:credits|credit)\s*[:\-]?\s*(\d+)/i);
      if (creditsMatch) {
        credits = parseInt(creditsMatch[1], 10) || 3;
      }
    }

    const units: ExtractedSyllabusDraft['units'] = [];
    let currentUnit: ExtractedSyllabusDraft['units'][0] | null = null;
    let unitIndex = 1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const unitMatch = line.match(/^(?:UNIT|CHAPTER|MODULE)\s*([0-9IVXLCDM]+)[\s:\-–—]+(.+)/i);

      if (unitMatch) {
        if (currentUnit) {
          units.push(currentUnit);
        }
        currentUnit = {
          unitNumber: unitIndex++,
          title: `Unit ${unitIndex - 1}: ${unitMatch[2].trim()}`,
          description: '',
          topics: [],
        };
        continue;
      }

      // If inside a unit, identify topics or bullet points
      if (currentUnit) {
        if (line.startsWith('-') || line.startsWith('*') || /^\d+\./.test(line)) {
          const topicText = line.replace(/^[-*\d.]+\s*/, '').trim();
          if (topicText.length > 5) {
            currentUnit.topics.push({
              topicNumber: currentUnit.topics.length + 1,
              title: topicText,
              description: `Detailed study of ${topicText}`,
              learningOutcomes: [`Understand the principles and applications of ${topicText}`],
              referenceMaterials: ['Standard Course Textbook'],
            });
          }
        } else if (!currentUnit.description && line.length > 15) {
          currentUnit.description = line;
        }
      }
    }

    if (currentUnit) {
      units.push(currentUnit);
    }

    // Fallback if no explicit unit headers were detected
    if (units.length === 0) {
      units.push({
        unitNumber: 1,
        title: 'Unit 1: Foundational Principles & Core Concepts',
        description: 'Comprehensive overview extracted from the provided syllabus document.',
        topics: [
          {
            topicNumber: 1,
            title: subjectName + ' - Fundamental Overview',
            description: 'Core concepts and theoretical background',
            learningOutcomes: ['Demonstrate foundational understanding of topic principles'],
            referenceMaterials: ['Prescribed University Textbook'],
          },
        ],
      });
    }

    return {
      subjectName,
      subjectCode,
      credits,
      programmeId: meta.programmeId,
      semester: meta.semester,
      syllabusVersion: meta.syllabusVersion || 'v1.0-Extracted',
      units,
    };
  }

  // Save approved syllabus into the active subjects database
  static publishSyllabus(
    institutionId: string,
    departmentId: string,
    draft: ExtractedSyllabusDraft
  ): Subject {
    const subjectId = 'subj_' + draft.subjectCode.toLowerCase() + '_' + Date.now().toString(36);

    const fullUnits: CurriculumUnit[] = draft.units.map((u) => {
      const uId = 'unit_' + crypto.randomUUID();
      const topics: CurriculumTopic[] = u.topics.map((t) => ({
        id: 'top_' + crypto.randomUUID(),
        unitId: uId,
        topicNumber: t.topicNumber,
        title: t.title,
        description: t.description,
        learningOutcomes: t.learningOutcomes,
        referenceMaterials: t.referenceMaterials,
      }));

      return {
        id: uId,
        subjectId,
        unitNumber: u.unitNumber,
        title: u.title,
        description: u.description,
        topics,
      };
    });

    const newSubject: Subject = {
      id: subjectId,
      institutionId,
      departmentId,
      programmeId: draft.programmeId,
      semester: draft.semester,
      name: draft.subjectName,
      code: draft.subjectCode,
      credits: draft.credits,
      description: `Official published curriculum for ${draft.subjectName} (${draft.subjectCode}).`,
      syllabusVersion: draft.syllabusVersion,
      isPublished: true,
      assignedTeacherIds: [],
      units: fullUnits,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    dataStore.subjects.set(newSubject.id, newSubject);

    dataStore.logAudit({
      institutionId,
      category: 'academic',
      action: 'SYLLABUS_PUBLISHED',
      details: {
        subjectId: newSubject.id,
        code: newSubject.code,
        name: newSubject.name,
        unitsCount: fullUnits.length,
      },
    });

    return newSubject;
  }
}
