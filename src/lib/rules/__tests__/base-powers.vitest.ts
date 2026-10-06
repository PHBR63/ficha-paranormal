import { describe, expect, it } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { getParanormalPowerEffects } from '@/lib/effects/paranormal-powers-effects-adapter';
import { calculatePowerModifiers, canChoosePower, getPowerById, type SavedParanormalPower } from '@/lib/paranormal-powers';
import { useParanormalEffects } from '@/hooks/useParanormalEffects';
import { useActivatableParanormalPowers } from '@/hooks/useActivatableParanormalPowers';
import { vi } from 'vitest';

const saved = (id:string, choices?:SavedParanormalPower['choices']): SavedParanormalPower => ({...getPowerById(id)!, choices});
describe('Poderes conferidos no Livro Base', () => {
  it('afinidade exige nova aquisição; Sangue de Ferro não duplica PV nem aumenta para quatro', () => {
    const power = saved('sangue-de-ferro');
    const one = getParanormalPowerEffects([power],99,'sangue',true);
    const two = getParanormalPowerEffects([power,power],99,'sangue',true);
    expect(one[0].mechanics).toMatchObject({hpBonus:40}); expect(one[0].mechanics.fortitudeBonus).toBeUndefined();
    expect(two).toHaveLength(1); expect(two[0].mechanics).toMatchObject({hpBonus:40,fortitudeBonus:5});
    expect(two[0].mechanics.hpBonusPerNex).toBeUndefined();
    expect(calculatePowerModifiers([power.id,power.id],99,true,'sangue')).toMatchObject({pv_bonus:40,fortitude:5});
  });
  it('Potencial Aprimorado aprimora uma vez; não basta escolher o elemento', () => {
    const power = saved('potencial-aprimorado');
    expect(getParanormalPowerEffects([power],50,'morte',true)[0].mechanics.peBonus).toBe(10);
    expect(getParanormalPowerEffects([power,power],50,'morte',true)[0].mechanics.peBonus).toBe(20);
  });
  it('Campo Protetor não é defesa permanente, e Anatomia Insana não é Fortitude', () => {
    const powers = [saved('campo-protetor'),saved('anatomia-insana')];
    const { result } = renderHook(() => useParanormalEffects({powers,nex:50,elementalAffinity:'energia',affinityActive:true}));
    expect(result.current.defenseBonus).toBe(0); expect(result.current.fortitudeBonus).toBe(0);
    expect(result.current.activeEffects.join(' ')).toContain('mestre');
  });
  it('segunda aquisição de Golpe aumenta multiplicador, conservando margem +1', () => {
    const power = saved('golpe-de-sorte');
    expect(getParanormalPowerEffects([power,power],50,'energia',true)[0].mechanics).toEqual({criticalMarginBonus:1,criticalMultiplierBonus:1});
    expect(canChoosePower(getPowerById(power.id)!,[power.id],true,'energia')).toBe(true);
    expect(canChoosePower(getPowerById(power.id)!,[power.id,power.id],true,'energia')).toBe(false);
  });
  it('Resistir usa 10/20, separa elementos e preserva escolhas legadas de Expansão sem bônus falso', () => {
    const blood=saved('resistir-a-elemento',{resistElement:'sangue'}); const energy=saved('resistir-a-elemento',{resistElement:'energia'});
    const effects=getParanormalPowerEffects([blood,blood,energy],50,'sangue',true);
    expect(effects).toHaveLength(2); expect(effects[0].mechanics.damageResistance?.sangue).toBe(20); expect(effects[1].mechanics.damageResistance?.energia).toBe(10);
    const expansion=saved('expansao-de-conhecimento',{skills:['ciencias']});
    const result=getParanormalPowerEffects([expansion],50,null,false);
    expect(result[0].mechanics.skillBonus).toBeUndefined(); expect(expansion.choices?.skills).toEqual(['ciencias']);
  });
  it('consultar poder situacional não gasta PV/PE nem ativa bônus ou confirma uso', () => {
    const onHPChange=vi.fn(),onPEChange=vi.fn(),onToggleConditionalBonus=vi.fn();
    const {result}=renderHook(() => useActivatableParanormalPowers({paranormalPowers:[saved('arma-de-sangue'),saved('surto-temporal')],nex:50,hpCurrent:20,peCurrent:20,onHPChange,onPEChange,onToggleConditionalBonus}));
    expect(result.current.getCost('arma-de-sangue')).toEqual({type:'pe',value:2});
    expect(result.current.getCost('surto-temporal')).toEqual({type:'pe',value:3});
    act(() => {expect(result.current.usePower('arma-de-sangue')).toBe(false);});
    expect(onHPChange).not.toHaveBeenCalled(); expect(onPEChange).not.toHaveBeenCalled(); expect(onToggleConditionalBonus).not.toHaveBeenCalled(); expect(result.current.usedCount).toBe(0);
  });
});
