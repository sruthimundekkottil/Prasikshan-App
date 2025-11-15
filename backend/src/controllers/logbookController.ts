import { Response } from 'express';
import { AuthRequest } from '../types';
import prisma from '../config/database';

export const createLogbookEntry = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { applicationId, date, hoursWorked, tasksCompleted, learnings, challenges } = req.body;

    const student = await prisma.student.findUnique({
      where: { userId },
    });

    if (!student) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    // Verify application belongs to student
    const application = await prisma.application.findFirst({
      where: {
        id: applicationId,
        studentId: student.id,
      },
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found or unauthorized' });
    }

    const entry = await prisma.logbookEntry.create({
      data: {
        applicationId,
        studentId: student.id,
        date: new Date(date),
        hoursWorked,
        tasksCompleted,
        learnings,
        challenges,
        isSynced: true,
      },
    });

    res.status(201).json(entry);
  } catch (error: any) {
    console.error('Create logbook entry error:', error);
    res.status(500).json({ error: 'Failed to create logbook entry', details: error.message });
  }
};

export const syncLogbookEntries = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { entries } = req.body;

    const student = await prisma.student.findUnique({
      where: { userId },
    });

    if (!student) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    // Bulk create entries from offline storage
    const created = await prisma.logbookEntry.createMany({
      data: entries.map((entry: any) => ({
        ...entry,
        studentId: student.id,
        date: new Date(entry.date),
        isSynced: true,
      })),
      skipDuplicates: true,
    });

    res.json({ message: 'Entries synced successfully', count: created.count });
  } catch (error: any) {
    console.error('Sync logbook entries error:', error);
    res.status(500).json({ error: 'Failed to sync entries', details: error.message });
  }
};

export const getLogbookEntries = async (req: AuthRequest, res: Response) => {
  try {
    const { applicationId } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    let entries;

    if (userRole === 'STUDENT') {
      const student = await prisma.student.findUnique({
        where: { userId },
      });

      if (!student) {
        return res.status(404).json({ error: 'Student profile not found' });
      }

      entries = await prisma.logbookEntry.findMany({
        where: {
          applicationId,
          studentId: student.id,
        },
        orderBy: {
          date: 'desc',
        },
      });
    } else if (userRole === 'FACULTY' || userRole === 'ADMIN') {
      entries = await prisma.logbookEntry.findMany({
        where: { applicationId },
        include: {
          student: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          date: 'desc',
        },
      });
    } else {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json(entries);
  } catch (error: any) {
    console.error('Get logbook entries error:', error);
    res.status(500).json({ error: 'Failed to fetch entries', details: error.message });
  }
};

export const updateLogbookEntry = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const student = await prisma.student.findUnique({
      where: { userId },
    });

    if (!student) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    const entry = await prisma.logbookEntry.findFirst({
      where: {
        id,
        studentId: student.id,
      },
    });

    if (!entry) {
      return res.status(404).json({ error: 'Entry not found or unauthorized' });
    }

    const updated = await prisma.logbookEntry.update({
      where: { id },
      data: req.body,
    });

    res.json(updated);
  } catch (error: any) {
    console.error('Update logbook entry error:', error);
    res.status(500).json({ error: 'Failed to update entry', details: error.message });
  }
};

export const deleteLogbookEntry = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const student = await prisma.student.findUnique({
      where: { userId },
    });

    if (!student) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    const entry = await prisma.logbookEntry.findFirst({
      where: {
        id,
        studentId: student.id,
      },
    });

    if (!entry) {
      return res.status(404).json({ error: 'Entry not found or unauthorized' });
    }

    await prisma.logbookEntry.delete({
      where: { id },
    });

    res.json({ message: 'Entry deleted successfully' });
  } catch (error: any) {
    console.error('Delete logbook entry error:', error);
    res.status(500).json({ error: 'Failed to delete entry', details: error.message });
  }
};
