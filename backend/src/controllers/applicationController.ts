import { Response } from 'express';
import { AuthRequest } from '../types';
import prisma from '../config/database';
import { calculateCredits } from '../utils/credits';

export const applyForInternship = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { internshipId, coverLetter, resumeUrl } = req.body;

    // Get student profile
    const student = await prisma.student.findUnique({
      where: { userId },
    });

    if (!student) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    // Check if already applied
    const existing = await prisma.application.findUnique({
      where: {
        studentId_internshipId: {
          studentId: student.id,
          internshipId,
        },
      },
    });

    if (existing) {
      return res.status(400).json({ error: 'Already applied to this internship' });
    }

    // Create application
    const application = await prisma.application.create({
      data: {
        studentId: student.id,
        internshipId,
        coverLetter,
        resumeUrl: resumeUrl || student.resumeUrl || '',
      },
      include: {
        internship: {
          include: {
            company: {
              select: {
                companyName: true,
              },
            },
          },
        },
      },
    });

    // Create notification for company
    const internship = await prisma.internship.findUnique({
      where: { id: internshipId },
      include: { company: true },
    });

    if (internship) {
      await prisma.notification.create({
        data: {
          userId: internship.company.userId,
          title: 'New Application',
          message: `${student.firstName} ${student.lastName} applied for ${internship.title}`,
          type: 'INFO',
          link: `/applications/${application.id}`,
        },
      });
    }

    res.status(201).json(application);
  } catch (error: any) {
    console.error('Apply error:', error);
    res.status(500).json({ error: 'Failed to apply', details: error.message });
  }
};

export const getMyApplications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const student = await prisma.student.findUnique({
      where: { userId },
    });

    if (!student) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    const applications = await prisma.application.findMany({
      where: { studentId: student.id },
      include: {
        internship: {
          include: {
            company: {
              select: {
                companyName: true,
                city: true,
                logo: true,
              },
            },
          },
        },
        faculty: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        appliedAt: 'desc',
      },
    });

    res.json(applications);
  } catch (error: any) {
    console.error('Get applications error:', error);
    res.status(500).json({ error: 'Failed to fetch applications', details: error.message });
  }
};

export const getApplicationsForInternship = async (req: AuthRequest, res: Response) => {
  try {
    const { internshipId } = req.params;
    const userId = req.user!.id;

    // Verify company owns this internship
    const company = await prisma.company.findUnique({
      where: { userId },
    });

    if (!company) {
      return res.status(404).json({ error: 'Company profile not found' });
    }

    const internship = await prisma.internship.findFirst({
      where: { id: internshipId, companyId: company.id },
    });

    if (!internship) {
      return res.status(404).json({ error: 'Internship not found or unauthorized' });
    }

    const applications = await prisma.application.findMany({
      where: { internshipId },
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            college: true,
            department: true,
            semester: true,
            skills: true,
            resumeUrl: true,
          },
        },
      },
      orderBy: {
        appliedAt: 'desc',
      },
    });

    res.json(applications);
  } catch (error: any) {
    console.error('Get internship applications error:', error);
    res.status(500).json({ error: 'Failed to fetch applications', details: error.message });
  }
};

export const updateApplicationStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, comments } = req.body;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        internship: {
          include: {
            company: true,
          },
        },
        student: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Authorization check
    if (userRole === 'COMPANY') {
      const company = await prisma.company.findUnique({
        where: { userId },
      });

      if (!company || application.internship.companyId !== company.id) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const updated = await prisma.application.update({
        where: { id },
        data: {
          status,
          companyComments: comments,
          companyReviewedAt: new Date(),
        },
      });

      // Notify student
      await prisma.notification.create({
        data: {
          userId: application.student.userId,
          title: 'Application Update',
          message: `Your application for ${application.internship.title} has been ${status.toLowerCase()}`,
          type: status === 'APPROVED' ? 'SUCCESS' : status === 'REJECTED' ? 'ERROR' : 'INFO',
          link: `/applications/${id}`,
        },
      });

      return res.json(updated);
    }

    if (userRole === 'FACULTY' || userRole === 'ADMIN') {
      const faculty = await prisma.faculty.findUnique({
        where: { userId },
      });

      if (!faculty) {
        return res.status(404).json({ error: 'Faculty profile not found' });
      }

      const updated = await prisma.application.update({
        where: { id },
        data: {
          facultyId: faculty.id,
          facultyComments: comments,
          facultyApprovedAt: new Date(),
        },
      });

      // Notify student
      await prisma.notification.create({
        data: {
          userId: application.student.userId,
          title: 'Faculty Review',
          message: `Your application for ${application.internship.title} has been reviewed by faculty`,
          type: 'INFO',
          link: `/applications/${id}`,
        },
      });

      return res.json(updated);
    }

    res.status(403).json({ error: 'Unauthorized' });
  } catch (error: any) {
    console.error('Update application error:', error);
    res.status(500).json({ error: 'Failed to update application', details: error.message });
  }
};

export const completeInternship = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        logbookEntries: true,
      },
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Calculate total hours
    const totalHours = application.logbookEntries.reduce(
      (sum, entry) => sum + entry.hoursWorked,
      0
    );

    // Calculate credits
    const credits = calculateCredits(totalHours);

    const updated = await prisma.application.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        hoursCompleted: totalHours,
        creditsAwarded: credits,
      },
    });

    // Update student total credits
    await prisma.student.update({
      where: { id: application.studentId },
      data: {
        totalCredits: {
          increment: credits,
        },
      },
    });

    res.json(updated);
  } catch (error: any) {
    console.error('Complete internship error:', error);
    res.status(500).json({ error: 'Failed to complete internship', details: error.message });
  }
};
