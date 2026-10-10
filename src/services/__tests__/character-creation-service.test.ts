import { describe,it,expect,vi,beforeEach } from 'vitest';
import { validCreation } from '@/test/fixtures/characterCreation';
const {rpc}=vi.hoisted(()=>({rpc:vi.fn()}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{rpc}}));
import { createCharacter } from '../character-creation-service';
describe('Confirmação da criação',()=>{
  beforeEach(()=>rpc.mockReset());
  it('não chama o servidor com escolhas incompletas',async()=>{
    await expect(createCharacter({...validCreation('Especialista'),classPowerChoices:{}},null,null)).rejects.toThrow('Perito');
    expect(rpc).not.toHaveBeenCalled();
  });
  it('não anuncia vínculo quando o servidor só confirma a ficha',async()=>{
    rpc.mockResolvedValue({data:{id:'character',confirmed:true,campaign_id:null},error:null});
    await expect(createCharacter(validCreation(),null,'campaign')).rejects.toThrow('não confirmou');
  });
  it('mantém a chave da operação ao repetir após resposta incerta',async()=>{
    rpc.mockResolvedValueOnce({data:null,error:{message:'Resposta perdida'}}).mockResolvedValueOnce({data:{id:'character',confirmed:true,campaign_id:null},error:null});
    const form=validCreation();
    await expect(createCharacter(form,null,null)).rejects.toThrow('Resposta perdida');
    await expect(createCharacter(form,null,null)).resolves.toEqual({id:'character'});
    expect(rpc.mock.calls[0][1].p_operation_id).toBe(rpc.mock.calls[1][1].p_operation_id);
  });
  it('aceita somente a confirmação do vínculo solicitado',async()=>{
    rpc.mockResolvedValue({data:{id:'character',confirmed:true,campaign_id:'campaign'},error:null});
    await expect(createCharacter(validCreation(),null,'campaign')).resolves.toEqual({id:'character'});
  });
});
