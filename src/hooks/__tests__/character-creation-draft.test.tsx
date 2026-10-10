import { describe,it,expect,vi,afterEach } from 'vitest';
import { renderHook,act } from '@testing-library/react';
import { useCharacterAutoSave,loadCharacterDraft,clearCharacterDraft } from '../useCharacterAutoSave';
import { validCreation } from '@/test/fixtures/characterCreation';
describe('Isolamento do rascunho',()=>{
  afterEach(()=>{localStorage.clear();vi.restoreAllMocks();});
  it('separa contas e campanhas e não recupera rascunho global sem autoria',()=>{
    localStorage.setItem('character-creation-draft',JSON.stringify({formData:validCreation(),savedAt:Date.now()}));
    const scope={userId:'owner',campaignId:'camp'};
    const hook=renderHook(()=>useCharacterAutoSave(validCreation(),4,false,scope));
    expect(loadCharacterDraft(scope)).toBeNull();
    hook.rerender();
    const save=renderHook(()=>useCharacterAutoSave(validCreation(),4,true,scope));
    act(()=>save.result.current.save());
    expect(loadCharacterDraft(scope)?.currentStep).toBe(4);
    expect(loadCharacterDraft({userId:'other',campaignId:'camp'})).toBeNull();
    expect(loadCharacterDraft({userId:'owner',campaignId:'other'})).toBeNull();
    clearCharacterDraft(scope);expect(loadCharacterDraft(scope)).toBeNull();
  });
  it('preserva o último rascunho e mostra aviso quando o navegador recusa gravação',()=>{
    const hook=renderHook(()=>useCharacterAutoSave(validCreation(),0,true,{userId:'owner'}));
    act(()=>hook.result.current.save());
    vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new Error('quota');});
    act(()=>hook.result.current.save());
    expect(hook.result.current.error).toContain('não conseguiu guardar');
    expect(loadCharacterDraft({userId:'owner'})?.formData.name).toBe('Agente de teste');
  });
  it('recusa estruturas aninhadas corrompidas antes de abrir a criação',()=>{
    const f=validCreation();
    localStorage.setItem('character-creation-draft:v2:owner:personal',JSON.stringify({version:2,savedAt:Date.now(),currentStep:0,formData:{...f,classPowerChoices:{bad:{powerId:'perito',chosenValues:null}}}}));
    expect(loadCharacterDraft({userId:'owner'})).toBeNull();
  });
  it('falha de limpeza não transforma uma criação confirmada em erro',()=>{
    vi.spyOn(Storage.prototype,'removeItem').mockImplementation(()=>{throw new Error('blocked');});
    expect(clearCharacterDraft({userId:'owner'})).toBe(false);
  });
});
