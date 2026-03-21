export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SCENARIOS } from '@/lib/data/scenarios';
import { CONVERSATION_SYSTEM_PROMPT, injectLevelRules } from '@/lib/claude/prompts';
import { callClaude } from '@/lib/claude/client';

import { getUserPlan, checkLimit, recordUsage } from '@/lib/planLimits';

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await (supabase.auth as any).getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // ── Tier Enforcement ────────────────────────────────────
        const plan = await getUserPlan(user.id);
        const { allowed, remaining } = await checkLimit(user.id, 'conversation', plan);

        if (!allowed) {
            return NextResponse.json({
                error: 'limit_reached',
                plan,
                remaining: 0,
                upgrade_url: '/pricing',
            }, { status: 403 });
        }

        const body = await req.json();
        const { scenario_id, language_id, level, skip_situation_id } = body;

        // 0. Resolve language code to UUID if needed
        let languageUuid = language_id;
        if (language_id && language_id.length <= 3) {
            const { data: langData, error: langError } = await supabase
                .from('languages')
                .select('id')
                .eq('code', language_id)
                .single();
            
            if (langError || !langData) {
                console.error('[conversation/start] Language resolution failed:', langError);
                return NextResponse.json({ error: 'Unsupported language' }, { status: 400 });
            }
            languageUuid = langData.id;
        }

        const scenario = SCENARIOS.find(s => s.id === scenario_id);
        if (!scenario) {
            return NextResponse.json({ error: 'Scenario not found' }, { status: 404 });
        }

        // ── Situation Selection Algorithm ────────────────────────
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

        const { data: recentHistory } = await (supabase as any)
            .from('user_situation_history')
            .select('situation_id, completed_at')
            .eq('user_id', user.id)
            .eq('scenario_type', scenario.id)
            .gte('completed_at', fourteenDaysAgo.toISOString())
            .order('completed_at', { ascending: true });

        const recentSituationIds = new Set(
            (recentHistory || []).map((h: { situation_id: string }) => h.situation_id)
        );

        const candidateSituations = scenario.situations.filter(
            s => s.id !== skip_situation_id
        );

        const freshSituations = candidateSituations.filter(
            s => !recentSituationIds.has(s.id)
        );

        let selectedSituation;
        if (freshSituations.length > 0) {
            selectedSituation = freshSituations[
                Math.floor(Math.random() * freshSituations.length)
            ];
        } else {
            const historyMap = new Map(
                (recentHistory || []).map((h: { situation_id: string; completed_at: string }) => [h.situation_id, h.completed_at])
            );
            const sorted = [...candidateSituations].sort((a, b) => {
                const aTime = historyMap.get(a.id) || '9999';
                const bTime = historyMap.get(b.id) || '9999';
                return aTime < bTime ? -1 : 1;
            });
            selectedSituation = sorted[0];
        }

        if (!selectedSituation) {
            selectedSituation = scenario.situations[0];
        }

        // ── Build System Prompt ─────────────────────────────────
        const difficultyNote = selectedSituation.difficulty_modifier > 0
            ? 'This is a more challenging variation — be realistic and do not make it too easy for the user.'
            : '';

        const systemPromptRaw = CONVERSATION_SYSTEM_PROMPT
            .replace('{CONTEXT}', scenario.base_context)
            .replace('{SITUATION}', selectedSituation.modifier)
            .replace('{GOAL}', scenario.goal)
            .replace('{LEVEL}', level || 'A2')
            .replace('{DIFFICULTY_NOTE}', difficultyNote);

        const systemPrompt = injectLevelRules(systemPromptRaw, level || 'A2');

        // ── Generate Opening Message via Claude Sonnet ──────────
        const response = await callClaude(
            [{ role: 'user', content: 'START SCENARIO. You are the AI character. Send ONLY your very first opening line to start the interaction (e.g., a greeting or asking how you can help). Do not send the user\'s response or any out-of-character text.' }],
            systemPrompt,
            { temperature: 0.7, maxTokens: 150, model: 'sonnet' }
        );

        const openingMessage = response.content || 'Hola.';

        const initialMessages = [
            {
                role: 'assistant',
                content: openingMessage,
                timestamp: new Date().toISOString()
            }
        ];

        // ── Create Session in DB ────────────────────────────────
        const { data: session, error: insertError } = await (supabase as any)
            .from('conversation_sessions')
            .insert({
                user_id: user.id,
                language_id: languageUuid,
                scenario_type: scenario.id,
                scenario_name: scenario.name,
                mode: 'text',
                messages: initialMessages,
                situation_id: selectedSituation.id,
                situation_name: selectedSituation.name,
                situation_twist: selectedSituation.twist,
            })
            .select()
            .single();

        if (insertError) {
            console.error("DB Insert Error", insertError);
            throw insertError;
        }

        // ── Record Usage ────────────────────────────────────────
        await recordUsage(user.id, 'conversation');

        return NextResponse.json({
            success: true,
            session_id: session.id,
            message: openingMessage,
            scenario,
            situation_name: selectedSituation.name,
            situation_teaser: selectedSituation.teaser,
            situation_twist: selectedSituation.twist,
            situation_id: selectedSituation.id,
        });

    } catch (error) {
        console.error('Conversation Start Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
