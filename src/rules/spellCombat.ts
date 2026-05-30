import type { Character, LearnedSpell } from '../state/gameState';
import { describeSpell } from './spell';

export type SpellCombatResult = {
  ok: boolean;
  caster: Character;
  target: Character;
  log: string;
};

const withHpFloor = (character: Character, hp: number): Character => ({
  ...character,
  hp: Math.max(0, hp)
});

export const resolveSpellCast = (caster: Character, target: Character, spell: LearnedSpell): SpellCombatResult => {
  const description = describeSpell(spell.name, spell.circle);

  if (caster.mp < description.manaCost) {
    return {
      ok: false,
      caster,
      target,
      log: `${caster.name} failed to cast ${spell.name}: MP ${caster.mp}/${description.manaCost}.`
    };
  }

  const spentCaster = {
    ...caster,
    mp: Math.max(0, caster.mp - description.manaCost)
  };

  if (description.category === 'heal') {
    const healed = Math.min(spentCaster.derived.maxHP, spentCaster.hp + description.power);

    return {
      ok: true,
      caster: { ...spentCaster, hp: healed },
      target,
      log: `${caster.name} cast ${spell.name} (${spell.circle} circle): healed ${healed - spentCaster.hp} HP, spent ${description.manaCost} MP.`
    };
  }

  if (description.category === 'defense') {
    return {
      ok: true,
      caster: { ...spentCaster, guarding: true },
      target,
      log: `${caster.name} cast ${spell.name} (${spell.circle} circle): guarding is active, spent ${description.manaCost} MP.`
    };
  }

  const nextTarget = withHpFloor(target, target.hp - description.power);
  const todoNote =
    description.category === 'summon' || description.category === 'utility'
      ? ' TODO: detailed summon/utility side effects are intentionally deferred.'
      : '';

  return {
    ok: true,
    caster: spentCaster,
    target: nextTarget,
    log: `${caster.name} cast ${spell.name} (${spell.circle} circle, ${description.rangeText}): ${description.power} damage to ${target.name}, spent ${description.manaCost} MP.${todoNote}`
  };
};
