/**
 * Catálogo de Equipamentos Gerais - Ordem Paranormal RPG
 * 
 * Baseado EXATAMENTE no livro de regras oficial (Tabela 3.8, pgs. 94-97)
 * 
 * Categorias do livro:
 * - Acessórios: Kit de Perícia, Utensílio, Vestimenta
 * - Explosivos: Granadas e Minas
 * - Itens Operacionais: Equipamentos de campo
 * - Itens Paranormais: Itens ligados ao Outro Lado
 */

// Tipo do item geral - conforme categorias do livro
export type ItemType = 
  | 'acessorio'     // Kit de Perícia, Utensílio, Vestimenta
  | 'explosivo'     // Granadas e explosivos
  | 'operacional'   // Itens operacionais de campo
  | 'paranormal'    // Itens paranormais ligados ao Outro Lado
  | 'municao';      // Munições para armas de fogo

// Elementos paranormais
export type ParanormalElement = 'Sangue' | 'Morte' | 'Conhecimento' | 'Energia' | 'Medo';

// Interface completa para item do catálogo
export interface CatalogItem {
  id: string;
  name: string;
  type: ItemType;
  category: '0' | 'I' | 'II' | 'III' | 'IV';
  spaces: number | '*'; // '*' = não ocupa espaço ou efeito especial
  description: string;
  effect?: string; // Efeito mecânico do item
  uses?: number; // Número de usos (se aplicável)
  consumable?: boolean; // Se é consumível
  element?: ParanormalElement; // Para itens paranormais com elemento
}

// ==================== ACESSÓRIOS ====================
// Tabela 3.8: Equipamentos Gerais - Acessórios (pg. 94)

export const ACCESSORIES: CatalogItem[] = [
  {
    id: 'kit_pericia',
    name: 'Kit de Perícia',
    type: 'acessorio',
    category: '0',
    spaces: 1,
    description: 'Um conjunto de ferramentas necessárias para algumas perícias ou usos de perícias. Sem o kit, você sofre -5 no teste. Existe um kit de perícia para cada perícia que exige este item.',
    effect: 'Necessário para alguns testes de perícia. Sem o kit, -5 no teste.',
    consumable: false,
  },
  {
    id: 'utensilio',
    name: 'Utensílio',
    type: 'acessorio',
    category: '0',
    spaces: 1,
    description: 'Um item comum que tenha uma utilidade específica, como um canivete, uma lupa, um smartphone ou um notebook. Um utensílio fornece +2 em uma perícia (exceto Luta e Pontaria). Por exemplo, um smartphone pode ser usado para acessar a internet e fornecer bônus em Ciências, enquanto um notebook pode ser preparado para invadir sistemas e fornecer bônus em Tecnologia. O mestre tem a palavra final se o utensílio é apropriado ou não.',
    effect: '+2 em uma perícia (exceto Luta e Pontaria). Precisa ser empunhado.',
    consumable: false,
  },
  {
    id: 'vestimenta',
    name: 'Vestimenta',
    type: 'acessorio',
    category: '0',
    spaces: 1,
    description: 'Uma peça de vestuário que fornece +2 em uma perícia (exceto Luta ou Pontaria). Por exemplo, um par de botas militares pode fornecer +2 em Atletismo, um terno ou vestido elegante pode fornecer +2 em Diplomacia e um manto com glifos pode fornecer +2 em Ocultismo. Assim como utensílios, o benefício de cada vestimenta deve ser aprovado pelo mestre. Você pode receber os bônus de no máximo duas vestimentas ao mesmo tempo. Vestir ou despir uma vestimenta é uma ação completa.',
    effect: '+2 em uma perícia (exceto Luta ou Pontaria). Máximo de 2 vestimentas.',
    consumable: false,
  },
];

// ==================== EXPLOSIVOS ====================
// Tabela 3.8: Equipamentos Gerais - Explosivos (pg. 94)
// Descrições completas na página 95

export const EXPLOSIVES: CatalogItem[] = [
  {
    id: 'granada_atordoamento',
    name: 'Granada de Atordoamento',
    type: 'explosivo',
    category: '0',
    spaces: 1,
    description: 'Também chamadas de flash-bang, por criarem um estouro barulhento e luminoso. Seres na área ficam atordoados por 1 rodada (Fortitude DT Agi reduz para ofuscado e surdo por uma rodada).',
    effect: 'Área 6m. Seres na área ficam atordoados 1 rodada. Fortitude DT Agi reduz para ofuscado e surdo por 1 rodada.',
    uses: 1,
    consumable: true,
  },
  {
    id: 'granada_fragmentacao',
    name: 'Granada de Fragmentação',
    type: 'explosivo',
    category: '0',
    spaces: 1,
    description: 'Espalha fragmentos perfurantes. Seres na área sofrem 8d6 pontos de dano de perfuração (Reflexos DT Agi reduz à metade).',
    effect: 'Área 6m. 8d6 dano de perfuração. Reflexos DT Agi reduz à metade.',
    uses: 1,
    consumable: true,
  },
  {
    id: 'granada_fumaca',
    name: 'Granada de Fumaça',
    type: 'explosivo',
    category: '0',
    spaces: 1,
    description: 'Produz uma fumaça espessa e escura. Seres na área ficam cegos e sob camuflagem total. A fumaça dura 2 rodadas.',
    effect: 'Área 6m. Seres ficam cegos e sob camuflagem total por 2 rodadas.',
    uses: 1,
    consumable: true,
  },
  {
    id: 'granada_incendiaria',
    name: 'Granada Incendiária',
    type: 'explosivo',
    category: '0',
    spaces: 1,
    description: 'Espalha labaredas incandescentes. Seres na área sofrem 6d6 pontos de dano de fogo e ficam em chamas (Reflexos DT Agi reduz o dano à metade e evita a condição em chamas).',
    effect: 'Área 6m. 6d6 dano de fogo + condição em chamas. Reflexos DT Agi reduz dano à metade e evita chamas.',
    uses: 1,
    consumable: true,
  },
  {
    id: 'mina_antipessoal',
    name: 'Mina Antipessoal',
    type: 'explosivo',
    category: '0',
    spaces: 1,
    description: 'Esta mina é ativada por controle remoto. Se você estiver a até alcance longo dela, pode gastar uma ação padrão para detoná-la. Ao explodir, a mina dispara centenas de bolas de aço em um cone de 6m, causando 12d6 pontos de dano de perfuração em todos os seres na área (Reflexos DT Int reduz à metade). Você define a direção do cone quando posiciona a mina no chão. Instalar a mina exige uma ação completa e um teste de Tática contra DT 15. Caso falhe, você gasta a mina, mas ela não funciona. Encontrar uma mina instalada exige um teste de Percepção (DT igual ao resultado do seu teste para instalá-la).',
    effect: 'Cone 6m. 12d6 dano perfuração. Reflexos DT Int reduz à metade. Instalar: ação completa + Tática DT 15.',
    uses: 1,
    consumable: true,
  },
];

// ==================== ITENS OPERACIONAIS ====================
// Tabela 3.8: Equipamentos Gerais - Itens Operacionais (pgs. 94-96)

export const OPERATIONAL_ITEMS: CatalogItem[] = [
  {
    id: 'algemas',
    name: 'Algemas',
    type: 'operacional',
    category: '0',
    spaces: 1,
    description: 'Um par de algemas de aço. Para prender uma pessoa que não esteja indefesa você precisa empunhar a algema, agarrar a pessoa (veja "Manobras de Combate", no Capítulo 4) e então vencer um novo teste de agarrar contra ela. Você pode prender os dois pulsos da pessoa (-5 em testes que exijam o uso das mãos, impede conjuração) ou um dos pulsos dela em um objeto imóvel adjacente, caso haja, para impedir que ela se mova. Escapar das algemas exige um teste de Acrobacia contra DT 30 (ou ter as chaves...).',
    effect: 'Prender pessoa: agarrar + novo teste. -5 em testes com mãos ou impede movimento. Escapar: Acrobacia DT 30.',
    consumable: false,
  },
  {
    id: 'arpeu',
    name: 'Arpéu',
    type: 'operacional',
    category: '0',
    spaces: 1,
    description: 'Um gancho de aço que pode ser amarrado na ponta de uma corda para fixar em muros, janelas, parapeitos de prédios... Prender um arpéu exige um teste de Pontaria (DT 15). Subir um muro com a ajuda de uma corda fornece +5 no teste de Atletismo.',
    effect: 'Prender: Pontaria DT 15. Subir com corda: +5 em Atletismo.',
    consumable: false,
  },
  {
    id: 'bandoleira',
    name: 'Bandoleira',
    type: 'operacional',
    category: 'I',
    spaces: 1,
    description: 'Um cinto com bolsos e alças. Uma vez por rodada, você pode sacar ou guardar um item em seu inventário como uma ação livre.',
    effect: '1/rodada: sacar ou guardar item como ação livre.',
    consumable: false,
  },
  {
    id: 'binoculos',
    name: 'Binóculos',
    type: 'operacional',
    category: '0',
    spaces: 1,
    description: 'Estes binóculos militares fornecem +5 em testes de Percepção para observar coisas distantes.',
    effect: '+5 em Percepção para observar coisas distantes.',
    consumable: false,
  },
  {
    id: 'bloqueador_sinal',
    name: 'Bloqueador de Sinal',
    type: 'operacional',
    category: 'I',
    spaces: 1,
    description: 'Este dispositivo compacto emite ondas que "poluem" a frequência de rádio usada por celulares, impedindo que qualquer aparelho desse tipo em alcance médio se conecte.',
    effect: 'Impede conexão de celulares em alcance médio.',
    consumable: false,
  },
  {
    id: 'cicatrizante',
    name: 'Cicatrizante',
    type: 'operacional',
    category: '0',
    spaces: 1,
    description: 'Um spray contendo um remédio com potente efeito cicatrizante. Você pode gastar uma ação padrão e este item para curar 2d8+2 PV em você ou em um ser adjacente.',
    effect: 'Ação padrão: cura 2d8+2 PV em você ou adjacente.',
    uses: 1,
    consumable: true,
  },
  {
    id: 'corda',
    name: 'Corda',
    type: 'operacional',
    category: '0',
    spaces: 1,
    description: 'Um rolo com 10 metros de corda resistente. Possui diversas utilidades: pode ajudar a descer um buraco ou prédio (+5 em testes de Atletismo nessas situações), amarrar pessoas inconscientes etc.',
    effect: '+5 em Atletismo para descer buracos/prédios. Amarrar pessoas.',
    consumable: false,
  },
  {
    id: 'equipamento_sobrevivencia',
    name: 'Equipamento de Sobrevivência',
    type: 'operacional',
    category: '0',
    spaces: 1,
    description: 'Uma mochila com saco de dormir, panelas, GPS e outros itens úteis para sobreviver no mato. Fornece +5 em testes de Sobrevivência para acampar e orientar-se e permite que você faça esses testes sem treinamento.',
    effect: '+5 em Sobrevivência para acampar e orientar-se. Permite testes sem treinamento.',
    consumable: false,
  },
  {
    id: 'lanterna_tatica',
    name: 'Lanterna Tática',
    type: 'operacional',
    category: '0',
    spaces: 1,
    description: 'Ilumina um cone de 9m. Além disso, você pode gastar uma ação de movimento para mirar a luz nos olhos de um ser em alcance curto. Ele fica ofuscado por 1 rodada, mas imune à lanterna pelo resto da cena.',
    effect: 'Ilumina cone 9m. Ação movimento: ofuscar ser em alcance curto por 1 rodada.',
    consumable: false,
  },
  {
    id: 'mascara_gas',
    name: 'Máscara de Gás',
    type: 'operacional',
    category: '0',
    spaces: 1,
    description: 'Uma máscara com filtro que cobre o rosto inteiro. Fornece +10 em testes de Fortitude contra efeitos que dependam de respiração.',
    effect: '+10 em Fortitude contra efeitos que dependam de respiração.',
    consumable: false,
  },
  {
    id: 'mochila_militar',
    name: 'Mochila Militar',
    type: 'operacional',
    category: 'I',
    spaces: '*',
    description: 'Uma mochila leve e de alta qualidade. Ela não usa nenhum espaço e aumenta sua capacidade de carga em 2 espaços.',
    effect: 'Não ocupa espaço. +2 espaços de capacidade de carga.',
    consumable: false,
  },
  {
    id: 'oculos_visao_termica',
    name: 'Óculos de Visão Térmica',
    type: 'operacional',
    category: 'I',
    spaces: 1,
    description: 'Estes óculos eliminam a penalidade em testes por camuflagem.',
    effect: 'Elimina penalidade em testes por camuflagem.',
    consumable: false,
  },
  {
    id: 'pe_de_cabra',
    name: 'Pé de Cabra',
    type: 'operacional',
    category: '0',
    spaces: 1,
    description: 'Esta barra de ferro fornece +5 em testes de Força para arrombar portas. Pode ser usada em combate como um bastão.',
    effect: '+5 em Força para arrombar portas. Pode ser usado como bastão.',
    consumable: false,
  },
  {
    id: 'pistola_dardos',
    name: 'Pistola de Dardos',
    type: 'operacional',
    category: 'I',
    spaces: 1,
    description: 'Esta arma leve dispara dardos com um sonífero em alcance curto. Para disparar em um ser, faça um ataque à distância contra ele. Se acertá-lo, ele fica inconsciente até o fim da cena (Fortitude DT Agi reduz para desprevenido e lento por uma rodada). A pistola vem com 2 dardos. Uma caixa adicional com 2 dardos é um item de categoria 0 que ocupa 1 espaço.',
    effect: 'Alcance curto. Acerto: alvo inconsciente até fim da cena. Fortitude DT Agi reduz para desprevenido e lento 1 rodada.',
    uses: 2,
    consumable: false,
  },
  {
    id: 'pistola_sinalizadora',
    name: 'Pistola Sinalizadora',
    type: 'operacional',
    category: '0',
    spaces: 1,
    description: 'Esta pistola dispara um sinalizador luminoso, útil para chamar outras pessoas para sua localização. Pode ser usada como uma arma de disparo leve com alcance curto que causa 2d6 pontos de dano de fogo. A pistola vem com 2 cargas. Uma caixa adicional com 2 cargas é um item de categoria 0 que ocupa 1 espaço.',
    effect: 'Sinalizador luminoso. Arma: alcance curto, 2d6 dano de fogo.',
    uses: 2,
    consumable: false,
  },
  {
    id: 'soqueira',
    name: 'Soqueira',
    type: 'operacional',
    category: '0',
    spaces: 1,
    description: 'Esta peça de metal é usada entre os dedos e permite socos mais perigosos — fornece +1 em rolagens de dano desarmado e os torna letais. Uma soqueira pode receber modificações e maldições de armas.',
    effect: '+1 em dano desarmado. Torna ataques desarmados letais.',
    consumable: false,
  },
  {
    id: 'spray_pimenta',
    name: 'Spray de Pimenta',
    type: 'operacional',
    category: 'I',
    spaces: 1,
    description: 'Este spray dispara um composto químico que causa dor e lacrimação. Você pode gastar uma ação padrão para atingir um ser adjacente. O ser fica cego por 1d4 rodadas (Fortitude DT Agi evita). A carga do spray dura dois usos.',
    effect: 'Ação padrão: alvo adjacente fica cego 1d4 rodadas. Fortitude DT Agi evita.',
    uses: 2,
    consumable: true,
  },
  {
    id: 'taser',
    name: 'Taser',
    type: 'operacional',
    category: 'I',
    spaces: 1,
    description: 'Um dispositivo de eletrochoque capaz de atordoar ou até incapacitar um alvo. Você pode gastar uma ação padrão para atingir um ser adjacente. O alvo sofre 1d6 pontos de dano de eletricidade e fica atordoado por uma rodada (Fortitude DT Agi evita). A bateria do taser dura dois usos.',
    effect: 'Ação padrão: 1d6 dano elétrico + atordoado 1 rodada. Fortitude DT Agi evita.',
    uses: 2,
    consumable: true,
  },
  {
    id: 'traje_hazmat',
    name: 'Traje Hazmat',
    type: 'operacional',
    category: 'I',
    spaces: 2,
    description: 'Uma roupa impermeável que cobre o corpo inteiro, usada para impedir o contato do usuário com materiais tóxicos. Fornece +5 em testes de resistência contra efeitos ambientais e resistência a químico 10.',
    effect: '+5 em resistência contra efeitos ambientais. Resistência a químico 10.',
    consumable: false,
  },
];

// ==================== ITENS PARANORMAIS ====================
// Tabela 3.10: Itens Paranormais (pg. 97)

export const PARANORMAL_ITEMS: CatalogItem[] = [
  // Amarras de Elemento (todas variações)
  {
    id: 'amarras_sangue',
    name: 'Amarras de Sangue',
    type: 'paranormal',
    category: 'II',
    spaces: 1,
    element: 'Sangue',
    description: 'Cordas ou correntes feitas de um elemento paranormal específico. As amarras são preparadas para imobilizar criaturas do Outro Lado que sejam vulneráveis ao elemento que as compõem e podem ser usadas de duas formas.',
    effect: 'ARMADILHA: ação completa + 2 PE para armar 3x3m. Criatura que atravesse testa Reflexos DT Int; falha = imóvel até fim da cena. LAÇAR: ação padrão + 1 PE para paralisar criatura até início do próximo turno. Manter: 1 PE/rodada.',
    consumable: false,
  },
  {
    id: 'amarras_morte',
    name: 'Amarras de Morte',
    type: 'paranormal',
    category: 'II',
    spaces: 1,
    element: 'Morte',
    description: 'Cordas ou correntes feitas de um elemento paranormal específico. As amarras são preparadas para imobilizar criaturas do Outro Lado que sejam vulneráveis ao elemento que as compõem.',
    effect: 'ARMADILHA: ação completa + 2 PE para armar 3x3m. LAÇAR: ação padrão + 1 PE para paralisar criatura.',
    consumable: false,
  },
  {
    id: 'amarras_conhecimento',
    name: 'Amarras de Conhecimento',
    type: 'paranormal',
    category: 'II',
    spaces: 1,
    element: 'Conhecimento',
    description: 'Cordas ou correntes feitas de um elemento paranormal específico. As amarras são preparadas para imobilizar criaturas do Outro Lado que sejam vulneráveis ao elemento que as compõem.',
    effect: 'ARMADILHA: ação completa + 2 PE para armar 3x3m. LAÇAR: ação padrão + 1 PE para paralisar criatura.',
    consumable: false,
  },
  {
    id: 'amarras_energia',
    name: 'Amarras de Energia',
    type: 'paranormal',
    category: 'II',
    spaces: 1,
    element: 'Energia',
    description: 'Cordas ou correntes feitas de um elemento paranormal específico. As amarras são preparadas para imobilizar criaturas do Outro Lado que sejam vulneráveis ao elemento que as compõem.',
    effect: 'ARMADILHA: ação completa + 2 PE para armar 3x3m. LAÇAR: ação padrão + 1 PE para paralisar criatura.',
    consumable: false,
  },
  {
    id: 'camera_aura_paranormal',
    name: 'Câmera de Aura Paranormal',
    type: 'paranormal',
    category: 'II',
    spaces: 1,
    description: 'Esta câmera amaldiçoada com Energia possui sigilos de Conhecimento para capturar auras paranormais. Tirar uma foto gasta uma ação padrão e 1 PE. As fotos são instantâneas e revelam a presença de auras paranormais em pessoas e objetos. As auras são da cor associada ao elemento.',
    effect: 'Ação padrão + 1 PE: revela auras paranormais em pessoas e objetos. Cor indica elemento.',
    consumable: false,
  },
  // Componentes Ritualísticos (todas variações)
  {
    id: 'componentes_energia',
    name: 'Componentes Ritualísticos de Energia',
    type: 'paranormal',
    category: '0',
    spaces: 1,
    element: 'Energia',
    description: 'Um conjunto de objetos utilizados em rituais de um elemento entre Sangue, Morte, Conhecimento ou Energia (não existem componentes ritualísticos de Medo). Componentes ritualísticos são necessários para a conjuração de rituais do elemento em questão.',
    effect: 'Necessário para conjurar rituais do elemento Energia. Inclui: eletricidade, dispositivos tecnológicos, pilhas, baterias, cabos de cobre e prata, pólvora, moedas, dados, ímãs...',
    consumable: false,
  },
  {
    id: 'componentes_sangue',
    name: 'Componentes Ritualísticos de Sangue',
    type: 'paranormal',
    category: '0',
    spaces: 1,
    element: 'Sangue',
    description: 'Um conjunto de objetos utilizados em rituais de Sangue.',
    effect: 'Necessário para conjurar rituais do elemento Sangue. Inclui: órgãos, carne, sangue, animais vivos, navalhas, agulhas, arame farpado, correntes, metal enferrujado, fluidos corporais...',
    consumable: false,
  },
  {
    id: 'componentes_morte',
    name: 'Componentes Ritualísticos de Morte',
    type: 'paranormal',
    category: '0',
    spaces: 1,
    element: 'Morte',
    description: 'Um conjunto de objetos utilizados em rituais de Morte.',
    effect: 'Necessário para conjurar rituais do elemento Morte. Inclui: ossos, dentes, cinzas, fios de cabelo, cristais pretos, relógios, galhos secos, folhas secas, plantas mortas, raízes, areia, poeira, lodo...',
    consumable: false,
  },
  {
    id: 'componentes_conhecimento',
    name: 'Componentes Ritualísticos de Conhecimento',
    type: 'paranormal',
    category: '0',
    spaces: 1,
    element: 'Conhecimento',
    description: 'Um conjunto de objetos utilizados em rituais de Conhecimento.',
    effect: 'Necessário para conjurar rituais do elemento Conhecimento. Inclui: escrituras, papéis, livros, pergaminhos, instrumentos de escrita, pedras preciosas, ouro, cordas, tecido, cristais brancos, vidro, máscaras...',
    consumable: false,
  },
  {
    id: 'emissor_pulsos_paranormais',
    name: 'Emissor de Pulsos Paranormais',
    type: 'paranormal',
    category: 'II',
    spaces: 1,
    description: 'Esta pequena caixa coberta de sigilos foi desenvolvida para servir como uma "isca" de criaturas paranormais. Ativar a caixa gasta uma ação completa e 1 PE. A caixa emite um pulso de um elemento definido pelo ativador, que atrai criaturas do mesmo elemento e afasta criaturas do elemento oposto. As criaturas afetadas têm direito a um teste de Vontade (DT Pre) para evitar o efeito.',
    effect: 'Ação completa + 1 PE: emite pulso que atrai criaturas do elemento escolhido e afasta do oposto. Vontade DT Pre evita.',
    consumable: false,
  },
  {
    id: 'escuta_ruidos_paranormais',
    name: 'Escuta de Ruídos Paranormais',
    type: 'paranormal',
    category: 'II',
    spaces: 1,
    description: 'Este microfone funciona como um aparato espião, com a diferença que consegue captar ruídos paranormais. Ativar a escuta gasta uma ação completa e 2 PE e faz com que ela grave ruídos por até 24 horas. Ouvir a escuta fornece +5 em testes de Ocultismo para identificar criatura.',
    effect: 'Ação completa + 2 PE: grava ruídos paranormais por 24h. +5 em Ocultismo para identificar criatura.',
    consumable: false,
  },
  {
    id: 'medidor_estabilidade_membrana',
    name: 'Medidor de Estabilidade da Membrana',
    type: 'paranormal',
    category: 'II',
    spaces: 1,
    description: 'Um dispositivo complexo, composto por diversos medidores — de temperatura, campo magnético, dilatação temporal... Um agente treinado em Ocultismo pode usar o medidor para avaliar o estado da Membrana em uma área (veja a página 97), o que indica a chance de uma entidade se manifestar nela. Um ambiente com valores racionais e constantes ao longo de algumas horas dificilmente originará uma criatura ou manifestação perigosa. Porém, se as leituras apresentaram dados inexplicáveis ou com grandes variações, o lugar poderá conter uma entidade. Apesar de ser um bom indicativo, o medidor não fornece respostas definitivas.',
    effect: 'Mede estabilidade da Membrana em uma área. Indica chance de manifestação paranormal.',
    consumable: false,
  },
  // Scanner de Manifestação Paranormal (todas variações)
  {
    id: 'scanner_sangue',
    name: 'Scanner de Manifestação Paranormal de Sangue',
    type: 'paranormal',
    category: 'II',
    spaces: 1,
    element: 'Sangue',
    description: 'Este item é composto por um dispositivo conectado a pequenos objetos amaldiçoados de uma entidade específica e adornado com uma série de sigilos. Ativar o scanner é uma ação padrão. Quando ativado, o scanner consome 1 PE por rodada do usuário, que sempre sabe a direção de todas as manifestações paranormais ativas (rituais, criaturas, itens amaldiçoados etc.) do elemento escolhido em alcance longo. Se o elemento principal de uma criatura for outro, mas ela tiver como complemento o elemento escolhido do scanner, também será detectada.',
    effect: 'Ação padrão para ativar. 1 PE/rodada: detecta manifestações do elemento em alcance longo.',
    consumable: false,
  },
  {
    id: 'scanner_morte',
    name: 'Scanner de Manifestação Paranormal de Morte',
    type: 'paranormal',
    category: 'II',
    spaces: 1,
    element: 'Morte',
    description: 'Scanner para detectar manifestações paranormais do elemento Morte.',
    effect: 'Ação padrão para ativar. 1 PE/rodada: detecta manifestações de Morte em alcance longo.',
    consumable: false,
  },
  {
    id: 'scanner_conhecimento',
    name: 'Scanner de Manifestação Paranormal de Conhecimento',
    type: 'paranormal',
    category: 'II',
    spaces: 1,
    element: 'Conhecimento',
    description: 'Scanner para detectar manifestações paranormais do elemento Conhecimento.',
    effect: 'Ação padrão para ativar. 1 PE/rodada: detecta manifestações de Conhecimento em alcance longo.',
    consumable: false,
  },
  {
    id: 'scanner_energia',
    name: 'Scanner de Manifestação Paranormal de Energia',
    type: 'paranormal',
    category: 'II',
    spaces: 1,
    element: 'Energia',
    description: 'Scanner para detectar manifestações paranormais do elemento Energia.',
    effect: 'Ação padrão para ativar. 1 PE/rodada: detecta manifestações de Energia em alcance longo.',
    consumable: false,
  },
  {
    id: 'scanner_medo',
    name: 'Scanner de Manifestação Paranormal de Medo',
    type: 'paranormal',
    category: 'II',
    spaces: 1,
    element: 'Medo',
    description: 'Scanner para detectar manifestações paranormais do elemento Medo.',
    effect: 'Ação padrão para ativar. 1 PE/rodada: detecta manifestações de Medo em alcance longo.',
    consumable: false,
  },
];

// ==================== MUNIÇÕES ====================
// Tabela 3.7: Armas e Munições - Munição (pg. 91)
// "Armas de fogo usam munição. Este livro usa um sistema abstrato: 
// em vez de contar cada bala, você compra pacotes de munição."

export const AMMUNITION: CatalogItem[] = [
  {
    id: 'municao_curta',
    name: 'Munição Curta',
    type: 'municao',
    category: '0',
    spaces: 1,
    description: 'Pacote de munição para pistolas, revólveres, submetralhadoras e outras armas de calibre pequeno. Cada pacote representa munição suficiente para uma cena de combate — você não precisa contar balas individualmente.',
    effect: 'Suficiente para uma cena de combate. Armas: pistolas, revólveres, submetralhadoras.',
    consumable: true,
  },
  {
    id: 'municao_longa',
    name: 'Munição Longa',
    type: 'municao',
    category: '0',
    spaces: 1,
    description: 'Pacote de munição para fuzis, carabinas, metralhadoras e outras armas de calibre médio/grande. Cada pacote representa munição suficiente para uma cena de combate.',
    effect: 'Suficiente para uma cena de combate. Armas: fuzis, carabinas, metralhadoras.',
    consumable: true,
  },
  {
    id: 'cartuchos',
    name: 'Cartuchos',
    type: 'municao',
    category: '0',
    spaces: 1,
    description: 'Pacote de cartuchos para espingardas. Cada pacote representa munição suficiente para uma cena de combate.',
    effect: 'Suficiente para uma cena de combate. Armas: espingardas.',
    consumable: true,
  },
  {
    id: 'flechas',
    name: 'Flechas/Virotes',
    type: 'municao',
    category: '0',
    spaces: 1,
    description: 'Pacote de flechas para arcos ou virotes para bestas. Cada pacote representa munição suficiente para uma cena de combate. Flechas e virotes podem ser recuperados após o combate (50% de chance de recuperar cada projétil usado).',
    effect: 'Suficiente para uma cena de combate. Armas: arcos, bestas. 50% de chance de recuperação.',
    consumable: true,
  },
  {
    id: 'combustivel',
    name: 'Combustível',
    type: 'municao',
    category: '0',
    spaces: 1,
    description: 'Galão de combustível para lança-chamas. Cada galão representa combustível suficiente para uma cena de combate.',
    effect: 'Suficiente para uma cena de combate. Armas: lança-chamas.',
    consumable: true,
  },
  {
    id: 'foguete',
    name: 'Foguete',
    type: 'municao',
    category: 'I',
    spaces: 1,
    description: 'Foguete individual para lança-foguetes (bazuca). Diferente de outras munições, cada foguete é contado individualmente devido ao seu tamanho e custo.',
    effect: 'Um disparo. Armas: lança-foguetes/bazuca.',
    uses: 1,
    consumable: true,
  },
];

// ==================== CATÁLOGO COMPLETO ====================

export const ALL_ITEMS: CatalogItem[] = [
  ...ACCESSORIES,
  ...EXPLOSIVES,
  ...OPERATIONAL_ITEMS,
  ...PARANORMAL_ITEMS,
  ...AMMUNITION,
];

// Função para buscar item por ID
export function getItemById(id: string): CatalogItem | undefined {
  return ALL_ITEMS.find(item => item.id === id);
}

// Função para buscar itens por tipo
export function getItemsByType(type: ItemType): CatalogItem[] {
  return ALL_ITEMS.filter(item => item.type === type);
}

// Labels para tipos de item - conforme livro
export const ITEM_TYPE_LABELS: Record<ItemType, { label: string; icon: string }> = {
  acessorio: { label: 'Acessórios', icon: 'Briefcase' },
  explosivo: { label: 'Explosivos', icon: 'Bomb' },
  operacional: { label: 'Operacionais', icon: 'Wrench' },
  paranormal: { label: 'Paranormais', icon: 'Eye' },
  municao: { label: 'Munições', icon: 'Target' },
};

// Função para obter nome do tipo
export function getItemTypeName(type: ItemType): string {
  return ITEM_TYPE_LABELS[type]?.label || type;
}

// Elementos paranormais para UI
export const PARANORMAL_ELEMENTS = ['Sangue', 'Morte', 'Conhecimento', 'Energia', 'Medo'] as const;

// Cores dos elementos para UI
export const ELEMENT_COLORS: Record<ParanormalElement, string> = {
  Sangue: 'text-red-500',
  Morte: 'text-gray-500',
  Conhecimento: 'text-yellow-500',
  Energia: 'text-purple-500',
  Medo: 'text-green-500',
};
