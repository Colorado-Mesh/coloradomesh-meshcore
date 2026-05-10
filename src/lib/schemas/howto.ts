interface HowToStep {
  name: string;
  text: string;
  url?: string;
  image?: string;
}

interface HowToOptions {
  totalTime?: string;
  estimatedCost?: string;
  supply?: string[];
  tool?: string[];
}

export function generateHowToSchema(
  name: string,
  description: string,
  steps: HowToStep[],
  options?: HowToOptions
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    description,
    ...(options?.totalTime && { totalTime: options.totalTime }),
    ...(options?.estimatedCost && {
      estimatedCost: {
        '@type': 'MonetaryAmount',
        currency: 'USD',
        value: options.estimatedCost,
      },
    }),
    ...(options?.supply && {
      supply: options.supply.map((s) => ({
        '@type': 'HowToSupply',
        name: s,
      })),
    }),
    ...(options?.tool && {
      tool: options.tool.map((t) => ({
        '@type': 'HowToTool',
        name: t,
      })),
    }),
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
      ...(step.url && { url: step.url }),
      ...(step.image && { image: step.image }),
    })),
  };
}

// Pre-built HowTo schema data for MeshCore setup
export const meshCoreSetupHowTo = {
  name: 'How to Set Up a MeshCore Node for the Colorado Mesh Network',
  description:
    'Step-by-step guide to flash firmware, configure your device, and join the Colorado MeshCore community mesh network.',
  totalTime: 'PT30M',
  estimatedCost: '50-100',
  supply: [
    'MeshCore-compatible LoRa device (T1000-E, RAK4631, Heltec V4, or T-Deck+)',
    'USB data cable',
    'Antenna (included with most devices)',
  ],
  tool: ['Chrome or Edge web browser', 'MeshCore Companion app (iOS or Android)'],
  steps: [
    {
      name: 'Flash MeshCore Firmware',
      text: 'Use the MeshCore web flasher to install firmware on your device. Connect via USB, select your device model and 915MHz frequency for USA, and follow the on-screen instructions.',
      url: 'https://flasher.meshcore.io/',
    },
    {
      name: 'Configure Your Node',
      text: 'Download the MeshCore Companion app, connect to your node via Bluetooth, set a unique node name, and configure USA/Canada radio preset.',
      url: 'https://meshcore.io/apps.html',
    },
    {
      name: 'Join the Colorado MeshCore Community',
      text: 'Connect with the community on Discord for help, share your node location, and start communicating on the mesh network.',
      url: 'https://discord.gg/Tuuv9hGPnX',
    },
  ],
};
