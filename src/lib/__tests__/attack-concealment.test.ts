import { describe, expect, it } from 'vitest';
import { attackCanRollDamage, concealmentChance, hasHeatVision, parseConcealmentResult } from '../attack-concealment';
import type { DiceRollResult } from '../dice-roller';
describe('Camuflagem por ataque', () => {
  it.each([['light',1,true],['light',2,true],['light',3,false],['total',5,true],['total',6,false]] as const)
    ('%s no d10 %s falha=%s', (level,die,failed) => {
      expect(parseConcealmentResult({level,die,failed,chance:concealmentChance(level,false,false),attackerBlind:false,heatVisionApplied:false,targetDefense:10}).failed).toBe(failed);
    });
  it('arma estruturada e melhoria real são necessárias; nome ou arco não concedem o benefício', () => {
    expect(hasHeatVision({ catalogId:'pistola', appliedModifications:['visao_de_calor'] })).toBe(true);
    expect(hasHeatVision({ catalogId:'arco', appliedModifications:['visao_de_calor'] })).toBe(false);
    expect(hasHeatVision({ weaponType:'firearm', appliedModifications:[] })).toBe(false);
  });
  it('Cego impõe 50% sem acumular; Visão de Calor altera chance e não a condição', () => {
    expect(concealmentChance('light',true,false)).toBe(50);
    expect(concealmentChance('total',true,false)).toBe(50);
    expect(concealmentChance('total',true,true)).toBe(0);
  });
  it('falha bloqueia dano mesmo com crítico, total alto e sem Defesa', () => {
    const result={total:100,isCritical:true,concealmentResult:{level:'total',attackerBlind:false,heatVisionApplied:false,chance:50,die:1,failed:true,targetDefense:null}} as DiceRollResult;
    expect(attackCanRollDamage(result,null)).toBe(false);
    result.concealmentResult!.failed=false; result.concealmentResult!.targetDefense=101;
    expect(attackCanRollDamage(result,0)).toBe(false);
  });
  it('não aceita chance/face falsificada nem d10 quando a arma ignora camuflagem', () => {
    expect(()=>parseConcealmentResult({level:'light',attackerBlind:false,heatVisionApplied:false,chance:20,die:11,failed:false,targetDefense:null})).toThrow();
    expect(()=>parseConcealmentResult({level:'total',attackerBlind:false,heatVisionApplied:true,chance:0,die:1,failed:false,targetDefense:null})).toThrow();
  });
});
