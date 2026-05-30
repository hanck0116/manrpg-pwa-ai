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
      log: `${caster.name}의 ${spell.name} 시전 실패: MP가 부족합니다. (${caster.mp}/${description.manaCost})`
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
      log: `${caster.name}이(가) ${spell.name} ${spell.circle}서클을 시전했습니다. HP를 ${healed - spentCaster.hp} 회복하고 MP ${description.manaCost}를 소모했습니다.`
    };
  }

  if (description.category === 'defense') {
    return {
      ok: true,
      caster: { ...spentCaster, guarding: true },
      target,
      log: `${caster.name}이(가) ${spell.name} ${spell.circle}서클을 시전했습니다. 방어 자세가 활성화되고 MP ${description.manaCost}를 소모했습니다.`
    };
  }

  const nextTarget = withHpFloor(target, target.hp - description.power);
  const todoNote =
    description.category === 'summon' || description.category === 'utility'
      ? ' 소환/기능 마법의 상세 부가 효과는 다음 단계에서 구현 예정입니다.'
      : '';

  return {
    ok: true,
    caster: spentCaster,
    target: nextTarget,
    log: `${caster.name}이(가) ${spell.name} ${spell.circle}서클(${description.rangeText})을 시전했습니다. ${target.name}에게 ${description.power} 피해를 주고 MP ${description.manaCost}를 소모했습니다.${todoNote}`
  };
};
