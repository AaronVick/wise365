// data/agents.js

// Agents data
const agents = {
  Administrative: [
    { id: 'shawn', name: 'Shawn', role: 'Tool Guidance Assistant', category: 'Administrative' },
    ...[
      { id: 'rom', name: 'Rom', role: 'PitchPerfect AI', category: 'Administrative' },
      { id: 'larry', name: 'Larry', role: 'Market Edge AI', category: 'Administrative' },
      { id: 'jen', name: 'Jen', role: 'CloseMaster AI', category: 'Administrative' },
      { id: 'daniela', name: 'Daniela', role: 'Reputation Builder AI', category: 'Administrative' },
      { id: 'caner', name: 'Caner', role: 'InsightPulse AI', category: 'Administrative' },
    ].sort((a, b) => a.name.localeCompare(b.name)),
  ],
  Marketing: [
    { id: 'mike', name: 'Mike', role: 'Trusted Marketing Strategist', category: 'Marketing' },
    { id: 'sylvester', name: 'Sylvester', role: 'Marketing Success Wheel Optimizer', category: 'Marketing' },
    { id: 'ally', name: 'Ally', role: 'Positioning Factors Accelerator', category: 'Marketing' },
    { id: 'orion', name: 'Orion', role: 'PersonaLead Magnet Maker', category: 'Marketing' },
    { id: 'jesse', name: 'Jesse', role: 'Email Marketing Maestro', category: 'Marketing' },
  ].sort((a, b) => a.name.localeCompare(b.name)),
  Sales: [
    { id: 'alex', name: 'Alex', role: 'Persona Pilot Pro', category: 'Sales' },
    { id: 'aaron', name: 'Aaron', role: 'T.I.N.B. Builder', category: 'Sales' },
    { id: 'troy', name: 'Troy', role: 'CrossSell Catalyst', category: 'Sales' },
    { id: 'jr', name: 'JR', role: 'Audience Gap Genius', category: 'Sales' },
  ].sort((a, b) => a.name.localeCompare(b.name)),
  SocialMedia: [
    { id: 'deborah', name: "De'Borah", role: 'Facebook Marketing Maestro', category: 'Social Media' },
    { id: 'claire', name: 'Claire', role: 'LinkedIn Messaging Maestro', category: 'Social Media' },
    { id: 'ej', name: 'EJ', role: 'TikTok Marketing Maestro', category: 'Social Media' },
    { id: 'lisa', name: 'Lisa', role: 'Instagram Marketing Maestro', category: 'Social Media' },
  ].sort((a, b) => a.name.localeCompare(b.name)),
  CopyEditing: [
    { id: 'antonio', name: 'Antonio', role: 'Video Story Architect', category: 'Copy Editing' },
    { id: 'mason', name: 'Mason', role: 'StoryAlign AI', category: 'Copy Editing' },
    { id: 'gabriel', name: 'Gabriel', role: 'Blog Blueprint', category: 'Copy Editing' },
    { id: 'sadie', name: 'Sadie', role: 'Ad Copy Maestro', category: 'Copy Editing' },
  ].sort((a, b) => a.name.localeCompare(b.name)),
};
