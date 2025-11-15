import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

interface InternshipReportData {
  student: {
    name: string;
    rollNumber: string;
    college: string;
    department: string;
    semester: number;
  };
  internship: {
    title: string;
    company: string;
    duration: number;
    startDate: string;
    endDate: string;
  };
  logbookEntries: Array<{
    date: string;
    hoursWorked: number;
    tasksCompleted: string;
    learnings: string;
  }>;
  evaluation?: {
    technicalSkills: number;
    communication: number;
    punctuality: number;
    initiative: number;
    overallRating: number;
    comments: string;
  };
  totalHours: number;
  creditsAwarded: number;
}

export const generateInternshipReport = (data: InternshipReportData): Readable => {
  const doc = new PDFDocument({ margin: 50 });

  // Header
  doc.fontSize(20).text('NEP 2020 Internship Report', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
  doc.moveDown(2);

  // Student Information
  doc.fontSize(16).text('Student Information', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(12);
  doc.text(`Name: ${data.student.name}`);
  doc.text(`Roll Number: ${data.student.rollNumber}`);
  doc.text(`College: ${data.student.college}`);
  doc.text(`Department: ${data.student.department}`);
  doc.text(`Semester: ${data.student.semester}`);
  doc.moveDown(2);

  // Internship Details
  doc.fontSize(16).text('Internship Details', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(12);
  doc.text(`Title: ${data.internship.title}`);
  doc.text(`Company: ${data.internship.company}`);
  doc.text(`Duration: ${data.internship.duration} weeks`);
  doc.text(`Period: ${data.internship.startDate} to ${data.internship.endDate}`);
  doc.moveDown(2);

  // Logbook Summary
  doc.fontSize(16).text('Logbook Summary', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(12);
  doc.text(`Total Hours Worked: ${data.totalHours} hours`);
  doc.text(`Credits Awarded: ${data.creditsAwarded} credits`);
  doc.text(`Total Entries: ${data.logbookEntries.length}`);
  doc.moveDown(2);

  // Logbook Entries
  doc.fontSize(16).text('Daily Logbook Entries', { underline: true });
  doc.moveDown(0.5);
  
  data.logbookEntries.forEach((entry, index) => {
    if (index > 0 && index % 3 === 0) {
      doc.addPage();
    }
    
    doc.fontSize(12).text(`Date: ${entry.date}`, { bold: true });
    doc.fontSize(10);
    doc.text(`Hours: ${entry.hoursWorked}`);
    doc.text(`Tasks: ${entry.tasksCompleted}`);
    doc.text(`Learnings: ${entry.learnings}`);
    doc.moveDown(1);
  });

  // Evaluation
  if (data.evaluation) {
    doc.addPage();
    doc.fontSize(16).text('Faculty Evaluation', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12);
    doc.text(`Technical Skills: ${data.evaluation.technicalSkills}/10`);
    doc.text(`Communication: ${data.evaluation.communication}/10`);
    doc.text(`Punctuality: ${data.evaluation.punctuality}/10`);
    doc.text(`Initiative: ${data.evaluation.initiative}/10`);
    doc.text(`Overall Rating: ${data.evaluation.overallRating}/10`);
    doc.moveDown(1);
    doc.text(`Comments: ${data.evaluation.comments}`);
  }

  // Footer
  doc.moveDown(3);
  doc.fontSize(10).text('This is a system-generated NEP 2020 compliant internship report.', {
    align: 'center',
    color: 'gray',
  });

  doc.end();
  return doc;
};
