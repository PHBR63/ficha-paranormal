/**
 * Templates de Relatório para exportação de validações
 * 
 * Gera relatórios em formato JSON e HTML/PDF para
 * documentação de conformidade com o livro oficial.
 * 
 * @module Ordem Paranormal RPG v1.3
 */

import type { ValidationReport, ValidationResult } from '@/lib/official-rules-validator';

/**
 * Gera relatório de validação em formato JSON
 */
export function generateJsonReport(
  report: ValidationReport, 
  groupedResults: Record<string, ValidationResult[]>
): string {
  const exportData = {
    metadata: {
      sistema: 'Ordem Paranormal RPG',
      versao: 'v1.3',
      dataGeracao: report.timestamp.toISOString(),
      dataFormatada: report.timestamp.toLocaleString('pt-BR'),
    },
    resumo: {
      totalTestes: report.totalTests,
      aprovados: report.passed,
      reprovados: report.failed,
      taxaSucesso: Math.round((report.passed / report.totalTests) * 100),
    },
    categorias: Object.entries(groupedResults).map(([categoria, resultados]) => ({
      nome: categoria,
      totalTestes: resultados.length,
      aprovados: resultados.filter(r => r.passed).length,
      reprovados: resultados.filter(r => !r.passed).length,
      testes: resultados.map(r => ({
        nome: r.test,
        aprovado: r.passed,
        esperado: r.expected,
        atual: r.actual,
        referencia: r.reference || null,
      })),
    })),
    testesReprovados: report.results
      .filter(r => !r.passed)
      .map(r => ({
        categoria: r.category,
        teste: r.test,
        esperado: r.expected,
        atual: r.actual,
        referencia: r.reference || null,
      })),
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Gera relatório de validação em formato HTML para impressão/PDF
 */
export function generatePdfReport(
  report: ValidationReport, 
  groupedResults: Record<string, ValidationResult[]>
): string {
  const successRate = Math.round((report.passed / report.totalTests) * 100);
  
  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Relatório de Validação - Ordem Paranormal RPG</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      padding: 20px; 
      color: #1a1a2e;
      line-height: 1.5;
    }
    .header { 
      text-align: center; 
      margin-bottom: 30px; 
      padding-bottom: 20px;
      border-bottom: 2px solid #4a0e4e;
    }
    .header h1 { 
      color: #4a0e4e; 
      font-size: 24px; 
      margin-bottom: 5px;
    }
    .header .subtitle { 
      color: #666; 
      font-size: 14px; 
    }
    .summary { 
      display: flex; 
      justify-content: center; 
      gap: 30px; 
      margin: 20px 0; 
      padding: 15px;
      background: #f8f9fa;
      border-radius: 8px;
    }
    .stat { text-align: center; }
    .stat-value { font-size: 28px; font-weight: bold; }
    .stat-label { font-size: 12px; color: #666; }
    .stat-passed .stat-value { color: #10b981; }
    .stat-failed .stat-value { color: #ef4444; }
    .stat-rate .stat-value { color: ${successRate === 100 ? '#10b981' : successRate >= 90 ? '#f59e0b' : '#ef4444'}; }
    .category { 
      margin: 20px 0; 
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
    }
    .category-header { 
      background: #f3f4f6;
      padding: 12px 15px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .category-name { font-weight: 600; font-size: 14px; }
    .category-stats { font-size: 12px; color: #666; }
    .tests { padding: 10px 15px; }
    .test { 
      padding: 8px 10px;
      margin: 5px 0;
      border-left: 3px solid;
      border-radius: 0 4px 4px 0;
      font-size: 12px;
    }
    .test-passed { 
      border-color: #10b981; 
      background: #ecfdf5; 
    }
    .test-failed { 
      border-color: #ef4444; 
      background: #fef2f2; 
    }
    .test-name { font-weight: 500; margin-bottom: 3px; }
    .test-detail { color: #666; font-size: 11px; }
    .test-detail span { display: inline-block; margin-right: 15px; }
    .expected { color: #10b981; }
    .actual { color: #ef4444; }
    .reference { font-style: italic; color: #6b7280; }
    .footer { 
      margin-top: 30px; 
      padding-top: 15px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 11px;
      color: #9ca3af;
    }
    .failed-summary {
      margin-top: 30px;
      padding: 15px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
    }
    .failed-summary h3 {
      color: #ef4444;
      margin-bottom: 10px;
      font-size: 14px;
    }
    @media print {
      body { padding: 10px; }
      .category { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📋 Relatório de Validação de Regras</h1>
    <div class="subtitle">Ordem Paranormal RPG v1.3</div>
    <div class="subtitle">Gerado em: ${report.timestamp.toLocaleString('pt-BR')}</div>
  </div>

  <div class="summary">
    <div class="stat">
      <div class="stat-value">${report.totalTests}</div>
      <div class="stat-label">Total de Testes</div>
    </div>
    <div class="stat stat-passed">
      <div class="stat-value">${report.passed}</div>
      <div class="stat-label">Aprovados</div>
    </div>
    <div class="stat stat-failed">
      <div class="stat-value">${report.failed}</div>
      <div class="stat-label">Reprovados</div>
    </div>
    <div class="stat stat-rate">
      <div class="stat-value">${successRate}%</div>
      <div class="stat-label">Taxa de Sucesso</div>
    </div>
  </div>

  ${Object.entries(groupedResults).map(([category, results]) => {
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    return `
    <div class="category">
      <div class="category-header">
        <span class="category-name">${category}</span>
        <span class="category-stats">${passed}/${results.length} aprovados${failed > 0 ? ` • ${failed} reprovado(s)` : ''}</span>
      </div>
      <div class="tests">
        ${results.map(r => `
          <div class="test ${r.passed ? 'test-passed' : 'test-failed'}">
            <div class="test-name">${r.passed ? '✓' : '✗'} ${r.test}</div>
            ${!r.passed ? `
              <div class="test-detail">
                <span class="expected">Esperado: ${r.expected}</span>
                <span class="actual">Atual: ${r.actual}</span>
                ${r.reference ? `<span class="reference">📖 ${r.reference}</span>` : ''}
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    </div>
    `;
  }).join('')}

  ${report.failed > 0 ? `
  <div class="failed-summary">
    <h3>⚠️ Resumo de Falhas (${report.failed})</h3>
    ${report.results.filter(r => !r.passed).map(r => `
      <div class="test test-failed">
        <div class="test-name">[${r.category}] ${r.test}</div>
        <div class="test-detail">
          <span class="expected">Esperado: ${r.expected}</span>
          <span class="actual">Atual: ${r.actual}</span>
        </div>
      </div>
    `).join('')}
  </div>
  ` : ''}

  <div class="footer">
    Sistema de Validação de Regras Oficiais • Ordem Paranormal RPG
  </div>
</body>
</html>
  `;

  return html;
}
