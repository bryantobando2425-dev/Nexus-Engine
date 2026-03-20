import { Router, type IRouter } from "express";
import { anthropic } from "@workspace/integrations-anthropic-ai";

const router: IRouter = Router();

function getVoiceInstructions(voice: string): string {
  const instructions: Record<string, string> = {
    third_person: "Narrate in third person. You are an omniscient author watching the player's character. Use 'he/she/they' based on character gender. Be literary, not mechanical.",
    first_person: "Narrate in second person present. You ARE the player's experience. 'You walk into the tavern. You notice the weight of your sword.' Make it visceral and immediate.",
    world_speaks: "The world narrates itself through found objects: diary entries, letters, graffiti on walls, songs overheard. Never narrate directly — always through artifacts of the world.",
    god_mode: "You are reporting to an omniscient deity who observes everything. Speak upward, as if briefing a god on what their mortal is doing. 'Your subject has entered the market district. Three factions watch.'"
  };
  return instructions[voice] || instructions.third_person;
}

function buildSystemPrompt(config: {
  gameConfig: Record<string, any>;
  voice: string;
  tone: Record<string, any>;
  era: Record<string, any>;
}): string {
  return `You are the NEXUS ENGINE narrator for "${config.gameConfig.name || 'A Life'}".

GAME PERSONALITY: ${config.gameConfig.narrativePersonality || 'You are narrating a human life in all its complexity. This is not an adventure — it is existence. The mundane is as important as the dramatic.'}

NARRATIVE VOICE: ${getVoiceInstructions(config.voice)}

ERA CONTEXT: ${config.era.eraName || 'Unknown Era'} (${config.era.year ?? 'unspecified year'})
- Technology available: ${Array.isArray(config.era.technology) ? config.era.technology.join(', ') : 'period-appropriate'}
- Social structure: ${config.era.socialStructure || 'hierarchical'}
- Danger level: ${((config.era.dangerLevel || 0.5) * 10).toFixed(0)}/10
- Magic exists: ${config.era.allowsMagic ?? false}

TONE:
- Realism level: ${((config.tone.baseRealism || 0.7) * 10).toFixed(0)}/10
- Current emotional context: ${config.tone.currentMood || 'neutral'}
- Explicit content: ${config.tone.explicitMode
    ? 'FULLY ENABLED. Narrate everything without filter. Violence, sexuality, death, suffering — all narrated directly and unflinchingly.'
    : 'DISABLED. Events of all types still occur — deaths, violence, sexuality — but narrate them without graphic detail. Imply, fade to black, focus on aftermath.'}

CRITICAL RULES:
1. Never repeat the same response twice even to identical actions. Context always changes the moment.
2. Maintain absolute historical and contextual coherence. No anachronisms.
3. NPCs have memory. They react based on history with the player.
4. Time does not pass while the player is deciding. It only advances through actions.
5. Consequences are real and permanent. Decisions matter.
6. Never announce that past-run echoes are appearing. Let them emerge naturally.
7. The world exists beyond the player. Things happen without them.
8. Match vocabulary, names, and references to the exact era.

RESPONSE FORMAT: Return ONLY a JSON object with these fields:
{
  "narrative": "The narrative text here. Be specific. Be consequential. 2-4 paragraphs.",
  "timeAdvanced": <minutes as integer, typically 15-120>,
  "eventType": "<one of: action, discovery, npc_encounter, location_visit, rest, travel, conflict, personal_moment>",
  "legacyWeight": <0.0-1.0, how significant/memorable this moment is>,
  "shouldGenerateImage": <true if this is a visually stunning or historically significant moment>,
  "mood": "<current emotional tone: tense, peaceful, melancholic, triumphant, ominous, tender, chaotic>",
  "characterStatChanges": {
    "health": <-10 to +5 or null>,
    "energy": <-20 to +20 or null>,
    "hunger": <-10 to +10 or null>,
    "morale": <-15 to +15 or null>,
    "mentalHealth": <-10 to +10 or null>
  }
}`;
}

function buildUserPrompt(config: {
  character: Record<string, any>;
  worldState: Record<string, any>;
  recentHistory: any[];
  activeEchoes: any[];
  playerAction: string;
  currentLocation: Record<string, any>;
  inGameDateTime: string;
}): string {
  const nearbyNPCs = (config.worldState.nearbyNPCs || [])
    .map((n: any) => `${n.name} (${n.disposition})`).join(', ');

  const recentHistoryText = config.recentHistory.slice(-10)
    .map((e: any) => `- [${e.timestampIngame || e.timestamp_ingame}] ${e.narrativeSnapshot || e.narrative_snapshot}`)
    .join('\n');

  const echoText = config.activeEchoes
    .filter((e: any) => e.discoveryDifficulty < 0.7)
    .map((e: any) => `- ${e.echoType}: ${(e.echoData as any)?.currentManifestations?.[0]?.description || ''}`)
    .join('\n') || 'none available now';

  return `CURRENT DATE/TIME: ${config.inGameDateTime}
LOCATION: ${config.currentLocation.name || 'Unknown'} — ${config.currentLocation.description || ''}

CHARACTER STATE:
- Name: ${config.character.name}, Age: ${config.character.age}
- Health: ${config.character.stats?.health ?? 100}/100
- Hunger: ${config.character.stats?.hunger ?? 50}/100
- Morale: ${config.character.stats?.morale ?? 70}/100
- Mental state: ${config.character.stats?.mentalHealth ?? 80}/100
- Current emotional state: ${config.worldState.characterMood || 'composed'}

WORLD STATE:
- Season: ${config.worldState.season || 'spring'}
- Weather: ${config.worldState.weather || 'clear'}
- Political climate: ${config.worldState.politicalClimate || 'stable'}
- Active conflicts: ${(config.worldState.activeConflicts || []).join(', ') || 'none'}
- NPCs nearby: ${nearbyNPCs || 'none'}

RECENT HISTORY (last events):
${recentHistoryText || 'No history yet — this is the beginning.'}

AVAILABLE LEGACY ECHOES (integrate naturally if contextually appropriate, never announce them explicitly):
${echoText}

PLAYER ACTION: "${config.playerAction}"

Narrate the result of this action. Be specific. Be consequential. Advance time only as much as the action warrants.`;
}

router.post("/generate", async (req, res) => {
  try {
    const {
      playerAction, voice, tone, character, worldState,
      recentHistory = [], activeEchoes = [], currentLocation,
      inGameDateTime, era, gameConfig,
    } = req.body;

    if (!playerAction) return res.status(400).json({ error: "playerAction required" });

    const systemPrompt = buildSystemPrompt({ gameConfig: gameConfig || {}, voice, tone, era });
    const userPrompt = buildUserPrompt({
      character, worldState, recentHistory, activeEchoes,
      playerAction, currentLocation, inGameDateTime,
    });

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      messages: [{ role: "user", content: userPrompt }],
      system: systemPrompt,
    });

    const content = message.content[0];
    if (content.type !== "text") throw new Error("Unexpected response type");

    let parsed: any;
    try {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        parsed = { narrative: content.text, timeAdvanced: 30, legacyWeight: 0.3, shouldGenerateImage: false };
      }
    } catch {
      parsed = { narrative: content.text, timeAdvanced: 30, legacyWeight: 0.3, shouldGenerateImage: false };
    }

    res.json({
      narrative: parsed.narrative || content.text,
      timeAdvanced: parsed.timeAdvanced || 30,
      eventType: parsed.eventType || "action",
      legacyWeight: parsed.legacyWeight || 0.3,
      shouldGenerateImage: parsed.shouldGenerateImage || false,
      mood: parsed.mood || null,
      characterStatChanges: parsed.characterStatChanges || null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate narrative" });
  }
});

router.post("/summarize-run", async (req, res) => {
  try {
    const { runId, events, character, era, endCause } = req.body;
    if (!runId || !events || !character || !era || !endCause) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const significantEvents = events
      .filter((e: any) => (e.legacyWeight || 0) > 0.4)
      .slice(0, 20)
      .map((e: any) => `- [${e.timestampIngame}] ${e.narrativeSnapshot}`)
      .join('\n');

    const prompt = `Write a 2-3 paragraph literary summary of this completed life. 
Character: ${character.name}, ${character.age} years old, in ${era.eraName}.
End cause: ${endCause}

Most significant moments:
${significantEvents || 'A quiet life with few recorded moments.'}

Write in third person, past tense. Make it feel like an epitaph or historical record. Be specific about who this person was.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.content[0];
    res.json({ summary: content.type === "text" ? content.text : "A life that passed quietly." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to summarize run" });
  }
});

export default router;
