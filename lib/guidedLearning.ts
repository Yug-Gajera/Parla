import { createClient } from '@/lib/supabase/client'

export async function completeScenario(
  userId: string,
  scenarioId: string,
  scenarioIndex: number,
  phaseScores: {
    phase1: boolean,
    phase2: boolean,
    phase3: number,
    phase4?: boolean
  }
): Promise<{
  success: boolean,
  newCompletedCount: number,
  nextScenarioUnlocked: boolean
}> {

  const supabase = createClient()

  try {
    const { data: currentUser, error: fetchError } =
      await supabase
        .from('users')
        .select(
          'guided_scenarios_completed, guided_scenario_progress'
        )
        .eq('id', userId)
        .single()

    if (fetchError) throw fetchError

    const currentProgress = 
      (currentUser as any).guided_scenario_progress || {}
    const currentCompleted = 
      (currentUser as any).guided_scenarios_completed || 0

    const alreadyCompleted = 
      currentProgress[scenarioId]?.phase3_complete === true

    const newProgress = {
      ...currentProgress,
      [scenarioId]: {
        ...currentProgress[scenarioId],
        phase1_complete: phaseScores.phase1,
        phase2_complete: phaseScores.phase2,
        phase3_complete: phaseScores.phase3 >= 55,
        phase3_score: phaseScores.phase3,
        phase4_complete: phaseScores.phase4 ?? false,
        completed_at: new Date().toISOString(),
      }
    }

    const newCompletedCount = alreadyCompleted
      ? currentCompleted
      : currentCompleted + 1

    const { error: updateError } = await supabase
      .from('users' as any)
      // @ts-ignore
      .update({
        guided_scenarios_completed: newCompletedCount,
        guided_scenario_progress: newProgress,
      })
      .eq('id', userId)

    if (updateError) throw updateError

    return {
      success: true,
      newCompletedCount,
      nextScenarioUnlocked: true,
    }

  } catch (error) {
    console.error('completeScenario error:', error)
    return {
      success: false,
      newCompletedCount: 0,
      nextScenarioUnlocked: false,
    }
  }
}
