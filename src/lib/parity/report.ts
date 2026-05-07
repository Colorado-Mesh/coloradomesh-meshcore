import { PARITY_MANIFEST, type ParityDomain, type ParityItem, type ParityStatus } from './manifest';

const domainOrder: ParityDomain[] = [
  'utilities',
  'repeater-config',
  'serial-usb',
  'prefix-matrix',
  'live-map-api',
  'live-map-ui',
  'docker',
  'ci',
];

const statusOrder: ParityStatus[] = ['implemented', 'partial', 'planned', 'deferred', 'out-of-scope'];

function countBy<T extends string>(items: ParityItem[], key: (item: ParityItem) => T): Record<T, number> {
  return items.reduce((acc, item) => {
    const value = key(item);
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {} as Record<T, number>);
}

export function buildParityReport(items: ParityItem[] = PARITY_MANIFEST): string {
  const byDomain = countBy(items, (item) => item.domain);
  const byStatus = countBy(items, (item) => item.status);
  const lines = ['# Colorado MeshCore Upstream Parity Report', ''];

  lines.push('## Summary', '');
  for (const status of statusOrder) {
    lines.push(`- ${status}: ${byStatus[status] ?? 0}`);
  }

  lines.push('', '## Domains', '');
  for (const domain of domainOrder) {
    lines.push(`- ${domain}: ${byDomain[domain] ?? 0}`);
  }

  lines.push('', '## Items', '');
  for (const item of items) {
    lines.push(`### ${item.id}`);
    lines.push(`- Domain: ${item.domain}`);
    lines.push(`- Status: ${item.status}`);
    lines.push(`- Local refs: ${item.local.length ? item.local.join(', ') : 'none'}`);
    lines.push(`- Coverage refs: ${item.coverage.length ? item.coverage.map((ref) => `${ref.type}:${ref.ref}`).join(', ') : 'none yet'}`);
    lines.push(`- Notes: ${item.notes}`);
    lines.push('');
  }

  return lines.join('\n');
}
