import { afterEach, describe, expect, it } from 'vitest';
import {
  clearPendingManeuver, clearPendingManeuverResolution, restorePendingManeuver,
  restorePendingManeuverResolution, savePendingManeuver, savePendingManeuverResolution,
  type ManeuverDeclarationRequest, type ManeuverResolutionRequest,
} from '../campaign-combat-maneuver-service';

const request: ManeuverDeclarationRequest = {
  operationId: '10000000-0000-4000-8000-000000000001',
  campaignId: '10000000-0000-4000-8000-000000000002',
  actorId: '10000000-0000-4000-8000-000000000003',
  targetId: '10000000-0000-4000-8000-000000000004',
  maneuverType: 'trip', weaponId: '__unarmed__', attribute: 'strength',
  scene: 1, round: 2, turnInstanceId: '10000000-0000-4000-8000-000000000005',
};

afterEach(() => sessionStorage.clear());

describe('recuperação da declaração de manobra', () => {
  it('persiste o UUID e o payload original para reenvio idempotente', () => {
    savePendingManeuver(request);
    expect(restorePendingManeuver(request.campaignId, request.actorId)).toEqual(request);
    clearPendingManeuver(request.campaignId, request.actorId);
    expect(restorePendingManeuver(request.campaignId, request.actorId)).toBeNull();
  });

  it('recusa alvo igual ao atacante antes de chamar o servidor', () => {
    expect(() => savePendingManeuver({ ...request, targetId: request.actorId }))
      .toThrow('Declaração de manobra inválida');
  });

  it('recusa Atropelar e integrações especiais fora deste lote', () => {
    expect(() => savePendingManeuver({ ...request, maneuverType: 'overrun' as never }))
      .toThrow('Declaração de manobra inválida');
  });

  it('preserva UUID e payload da resolução mestre até confirmação do servidor', () => {
    const resolution: ManeuverResolutionRequest = {
      operationId: '10000000-0000-4000-8000-000000000006',
      maneuverId: request.operationId, defenderAttribute: 'agility',
      attackerModifier: 2, defenderModifier: -1, justification: 'Cobertura da mesa',
      adjacencyConfirmed: true, freeHandConfirmed: false, targetItemId: 'item-1',
    };
    savePendingManeuverResolution(resolution);
    expect(restorePendingManeuverResolution(request.operationId)).toEqual(resolution);
    clearPendingManeuverResolution(request.operationId);
    expect(restorePendingManeuverResolution(request.operationId)).toBeNull();
  });
});
