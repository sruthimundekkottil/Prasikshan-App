// AI-based skill matching algorithm
export const calculateSkillMatch = (studentSkills: string[], requiredSkills: string[]): number => {
  if (requiredSkills.length === 0) return 100;
  
  const normalizedStudentSkills = studentSkills.map(s => s.toLowerCase().trim());
  const normalizedRequiredSkills = requiredSkills.map(s => s.toLowerCase().trim());
  
  let matchCount = 0;
  let partialMatchScore = 0;
  
  for (const required of normalizedRequiredSkills) {
    // Exact match
    if (normalizedStudentSkills.includes(required)) {
      matchCount++;
    } else {
      // Partial match (fuzzy matching)
      for (const student of normalizedStudentSkills) {
        if (student.includes(required) || required.includes(student)) {
          partialMatchScore += 0.5;
          break;
        }
      }
    }
  }
  
  const totalScore = matchCount + partialMatchScore;
  const matchPercentage = (totalScore / normalizedRequiredSkills.length) * 100;
  
  return Math.min(Math.round(matchPercentage), 100);
};

export const rankInternshipsForStudent = (
  studentSkills: string[],
  internships: Array<{ id: string; skills: string[]; [key: string]: any }>
) => {
  return internships
    .map(internship => ({
      ...internship,
      matchScore: calculateSkillMatch(studentSkills, internship.skills),
    }))
    .sort((a, b) => b.matchScore - a.matchScore);
};
