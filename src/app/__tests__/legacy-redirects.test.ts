import { describe, expect, it, vi } from 'vitest';

const redirectMock = vi.hoisted(() => vi.fn((destination: string) => {
  throw new Error(`redirect:${destination}`);
}));

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
}));

describe('legacy utility route pages', () => {
  it.each([
    ['repeater name', '../repeater_name_tool/page', '/tools/repeater-name'],
    ['companion name', '../companion_name_tool/page', '/tools/companion-name'],
    ['prefix matrix', '../prefix_matrix/page', '/tools/prefix-matrix'],
    ['serial USB', '../serial_usb_tool/page', '/tools/serial-usb'],
  ])('redirects the legacy %s route', async (_label, modulePath, destination) => {
    redirectMock.mockClear();
    const page = await import(modulePath);

    expect(() => page.default()).toThrow(`redirect:${destination}`);
    expect(redirectMock).toHaveBeenCalledWith(destination);
  });
});
