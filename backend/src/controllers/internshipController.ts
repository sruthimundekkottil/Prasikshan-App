import { Response } from 'express';
import { AuthRequest } from '../types';
import prisma from '../config/database';
import { rankInternshipsForStudent } from '../utils/matching';

export const createInternship = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // Get company profile
    const company = await prisma.company.findUnique({
      where: { userId },
    });

    if (!company) {
      return res.status(404).json({ error: 'Company profile not found' });
    }

    const internship = await prisma.internship.create({
      data: {
        ...req.body,
        companyId: company.id,
      },
      include: {
        company: {
          select: {
            companyName: true,
            industry: true,
            city: true,
          },
        },
      },
    });

    res.status(201).json(internship);
  } catch (error: any) {
    console.error('Create internship error:', error);
    res.status(500).json({ error: 'Failed to create internship', details: error.message });
  }
};

export const getInternships = async (req: AuthRequest, res: Response) => {
  try {
    const { status, location, skills, matchForStudent } = req.query;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (location) {
      where.location = { contains: location as string, mode: 'insensitive' };
    }

    if (skills) {
      const skillArray = (skills as string).split(',');
      where.skills = { hasSome: skillArray };
    }

    const internships = await prisma.internship.findMany({
      where,
      include: {
        company: {
          select: {
            companyName: true,
            industry: true,
            city: true,
            logo: true,
          },
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // AI-based matching if student requests
    if (matchForStudent === 'true' && req.user?.role === 'STUDENT') {
      const student = await prisma.student.findUnique({
        where: { userId: req.user.id },
        select: { skills: true },
      });

      if (student) {
        const rankedInternships = rankInternshipsForStudent(student.skills, internships);
        return res.json(rankedInternships);
      }
    }

    res.json(internships);
  } catch (error: any) {
    console.error('Get internships error:', error);
    res.status(500).json({ error: 'Failed to fetch internships', details: error.message });
  }
};

export const getInternshipById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const internship = await prisma.internship.findUnique({
      where: { id },
      include: {
        company: {
          select: {
            companyName: true,
            industry: true,
            city: true,
            logo: true,
            description: true,
            website: true,
          },
        },
        tasks: true,
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });

    if (!internship) {
      return res.status(404).json({ error: 'Internship not found' });
    }

    res.json(internship);
  } catch (error: any) {
    console.error('Get internship error:', error);
    res.status(500).json({ error: 'Failed to fetch internship', details: error.message });
  }
};

export const updateInternship = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Verify ownership
    const company = await prisma.company.findUnique({
      where: { userId },
    });

    if (!company) {
      return res.status(404).json({ error: 'Company profile not found' });
    }

    const internship = await prisma.internship.findFirst({
      where: { id, companyId: company.id },
    });

    if (!internship) {
      return res.status(404).json({ error: 'Internship not found or unauthorized' });
    }

    const updated = await prisma.internship.update({
      where: { id },
      data: req.body,
    });

    res.json(updated);
  } catch (error: any) {
    console.error('Update internship error:', error);
    res.status(500).json({ error: 'Failed to update internship', details: error.message });
  }
};

export const deleteInternship = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Verify ownership
    const company = await prisma.company.findUnique({
      where: { userId },
    });

    if (!company) {
      return res.status(404).json({ error: 'Company profile not found' });
    }

    const internship = await prisma.internship.findFirst({
      where: { id, companyId: company.id },
    });

    if (!internship) {
      return res.status(404).json({ error: 'Internship not found or unauthorized' });
    }

    await prisma.internship.delete({
      where: { id },
    });

    res.json({ message: 'Internship deleted successfully' });
  } catch (error: any) {
    console.error('Delete internship error:', error);
    res.status(500).json({ error: 'Failed to delete internship', details: error.message });
  }
};
