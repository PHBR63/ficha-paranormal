/**
 * Barrel export para componentes da campanha v3
 * 
 * Layout minimalista funcional com:
 * - Header compacto
 * - Navegação consolidada (4-5 abas)
 * - StatusBar com presença
 * 
 * @module components/campaign/v3
 */

export { CampaignHeader } from './CampaignHeader';
export { CampaignNavigation, type CampaignTab } from './CampaignNavigation';
export { CampaignStatusBar } from './CampaignStatusBar';

// Tabs serão adicionadas progressivamente
export { PanelTab } from './tabs/PanelTab';
export { ChatTab } from './tabs/ChatTab';
export { MapTab } from './tabs/MapTab';
export { ResourcesTab } from './tabs/ResourcesTab';
export { MasterTab } from './tabs/MasterTab';
