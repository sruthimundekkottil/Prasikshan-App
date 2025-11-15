import { Response } from 'express';
import { AuthRequest } from '../types';
import prisma from '../config/database';
import { generateInternshipReport } from '../utils/pdfGenerator';

export const generateReport = async (req: AuthRequest, res: Response) => {
  try {
    const { applicationId } = req.params;
    const userId = req.user!.id;

    const student = await prisma.student.findUnique({
      where: { userId },
    });

    if (!student) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    const application = await prisma.application.findFirst({
      where: {
        id: applicationId,
        studentId: student.id,
      },
      include: {
        internship: {
          include: {
            company: true,
          },
        },
        logbookEntries: {
          orderBy: {
            date: 'asc',
          },
        },
        evaluation: true,
      },
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found or unauthorized' });
    }

    const totalHours = application.logbookEntries.reduce(
      (sum, entry) => sum + entry.hoursWorked,
      0
    );

    const reportData = {
      student: {
        name: `${student.firstName} ${student.lastName}`,
        rollNumber: student.rollNumber,
        college: student.college,
        department: student.department,
        semester: student.semester,
      },
      internship: {
        title: application.internship.title,
        company: application.internship.company.companyName,
        duration: application.internship.duration,
        startDate: application.internship.startDate.toLocaleDateString(),
        endDate: application.internship.endDate.toLocaleDateString(),
      },
      logbookEntries: application.logbookEntries.map(entry => ({
        date: entry.date.toLocaleDateString(),
        hoursWorked: entry.hoursWorked,
        tasksCompleted: entry.tasksCompleted,
        learnings: entry.learnings,
      })),
      evaluation: application.evaluation
        ? {
            technicalSkills: application.evaluation.technicalSkills,
            communication: application.evaluation.communication,
            punctuality: application.evaluation.punctuality,
            initiative: application.evaluation.initiative,
            overallRating: application.evaluation.overallRating,
            comments: application.evaluation.comments || '',
          }
        : undefined,
      totalHours,
      creditsAwarded: application.creditsAwarded || 0,
    };

    const pdfStream = generateInternshipReport(reportData);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=internship-report-${student.rollNumber}.pdf`
    );

    pdfStream.pipe(res);
  } catch (error: any) {
    console.error('Generate report error:', error);
    res.status(500).json({ error: 'Failed to generate report', details: error.message });
  }
};
