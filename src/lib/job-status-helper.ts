export type JobStatusKey = 'active_applications' | 'ongoing' | 'paused' | 'completed' | 'cancelled'

export interface JobDisplayStatus {
  key: JobStatusKey
  label: string
  badgeColor: string
  ringColor: string
  canApply: boolean
  description: string
}

/**
 * Derives the dynamic display status of a job posting based on its database status
 * and application deadline timestamp.
 *
 * Rules:
 * 1. 'completed' => Completed (drive concluded, hiring finalized)
 * 2. 'cancelled' => Drive Cancelled (drive scrapped, 0 penalty refund)
 * 3. 'paused' => Applications Paused (temporarily frozen, students can view but not apply)
 * 4. 'active' + past deadline => Ongoing (application window closed, selection rounds underway)
 * 5. 'active' + future/null deadline => Active Applications (open for student applications)
 */
export function getJobDisplayStatus(job: {
  status: string
  application_deadline?: string | null
}): JobDisplayStatus {
  if (job.status === 'completed') {
    return {
      key: 'completed',
      label: 'Completed',
      badgeColor: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700',
      ringColor: 'ring-zinc-500/20 text-zinc-700 bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-300',
      canApply: false,
      description: 'Recruitment drive successfully concluded.',
    }
  }

  if (job.status === 'cancelled') {
    return {
      key: 'cancelled',
      label: 'Drive Cancelled',
      badgeColor: 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300 border-red-300 dark:border-red-900',
      ringColor: 'ring-red-600/20 text-red-700 bg-red-50 dark:bg-red-950/40 dark:text-red-300',
      canApply: false,
      description: 'Recruitment drive was cancelled/aborted.',
    }
  }

  if (job.status === 'paused') {
    return {
      key: 'paused',
      label: 'Applications Paused',
      badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-300 dark:border-amber-800',
      ringColor: 'ring-amber-600/20 text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300',
      canApply: false,
      description: 'Applications are temporarily paused by college administration.',
    }
  }

  // Active status: check deadline to differentiate "Active Applications" vs "Ongoing"
  const isDeadlinePassed = job.application_deadline
    ? new Date().getTime() > new Date(job.application_deadline).getTime()
    : false

  if (isDeadlinePassed) {
    return {
      key: 'ongoing',
      label: 'Ongoing',
      badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border-blue-300 dark:border-blue-800',
      ringColor: 'ring-blue-600/20 text-blue-700 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-300',
      canApply: false,
      description: 'Application deadline has passed. Selection rounds & interviews are in progress.',
    }
  }

  return {
    key: 'active_applications',
    label: 'Active Applications',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
    ringColor: 'ring-emerald-600/20 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300',
    canApply: true,
    description: 'Open for student applications.',
  }
}
