import { CandidateValidation } from '../types/candidates';

export function determineStatus(validations: CandidateValidation[], isTechnicalPosition: boolean): string {
  // Get the latest validation for each type
  const salesValidation = validations
    .filter(v => v.type === 'sales')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

  const techValidation = validations
    .filter(v => v.type === 'tech')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

  // Technical position validation logic
  if (isTechnicalPosition) {
    // If Tech has rejected, candidate is rejected immediately
    if (techValidation?.status === 'rejected') {
      return 'rejected';
    }

    // If Tech has approved
    if (techValidation?.status === 'approved') {
      // If Sales has also approved, candidate is validated
      if (salesValidation?.status === 'approved') {
        return 'validated';
      }
      // If Sales hasn't validated yet, waiting for Sales
      if (!salesValidation) {
        return 'pending_sales';
      }
      // If Sales has rejected, Tech decision is prioritized
      if (salesValidation.status === 'rejected') {
        return 'validated';
      }
    }

    // If no Tech validation yet
    if (!techValidation) {
      return 'pending_tech';
    }
  } 
  // Non-technical position validation logic
  else {
    // Only Sales validation matters
    if (salesValidation) {
      return salesValidation.status === 'approved' ? 'validated' : 'rejected';
    }
    // If no Sales validation yet
    return 'pending_sales';
  }

  // Default case
  return 'pending';
}