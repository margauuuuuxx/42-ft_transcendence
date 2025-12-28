import { SocialPage } from '../components/Social.js';

export async function socialListener(): Promise<void> {
  console.log('Social page loaded');
  
  // Create and initialize the social page
  const socialPage = new SocialPage();
  
  // Make it globally available for onclick handlers
  (window as any).socialPage = socialPage;
  
  // Initialize the page
  await socialPage.init();
}