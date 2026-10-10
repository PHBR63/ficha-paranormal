import { describe, expect, it, vi } from 'vitest';
const database = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: database }));
import { auditStatsCalculation, autoFixCharacterIssues, type CharacterForAudit } from '../character-audit-engine';

const character: CharacterForAudit = { id: 'qa', name: 'QA', class: 'Ocultista', class_track: 'lamina-paranormal', origin: 'academico', nex: 10, vigor: 1, presence: 2, agility: 2, intellect: 2, hp_max: 16, pe_max: 12, san_max: 24, defense: 12, abilities: [] };

describe('Auditoria preserva SAN permanente e SAN atual', () => {
  it('perda abaixo da fórmula exige conferência manual sem reposição', () => {
    const issue = auditStatsCalculation(character).issues.find(issue => issue.category === 'sanity');
    expect(issue).toMatchObject({ severity: 'warning', autoFixable: false, currentValue: 24, expectedValue: 25 });
    expect(issue?.description).toContain('perdas permanentes');
  });
  it('valor superior continua divergente e também não permite correção automática', () => {
    expect(auditStatsCalculation({ ...character, san_max: 26 }).issues.find(issue => issue.category === 'sanity')).toMatchObject({ severity: 'error', autoFixable: false });
  });
  it('seleção antiga de correção de SAN é recusada antes de qualquer escrita', async () => {
    const issue = auditStatsCalculation(character).issues.find(issue => issue.category === 'sanity')!;
    const result = await autoFixCharacterIssues('qa', 'owner', [{ ...issue, autoFixable: true }]);
    expect(result).toMatchObject({ success: false, fixedCount: 0, appliedFixes: [] });
    expect(result.errors[0]).toContain('nenhuma correção');
    expect(database.from).not.toHaveBeenCalled();
  });
  it('re-auditar com valor base não inventa perda permanente', () => {
    expect(auditStatsCalculation({ ...character, san_max: 25 }).issues.some(issue => issue.category === 'sanity')).toBe(false);
  });
});
