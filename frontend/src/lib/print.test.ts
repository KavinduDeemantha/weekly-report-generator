import { describe, expect, it, vi } from 'vitest';
import { printPage } from './print';

describe('printPage', () => {
  it('invokes the browser print dialog', () => {
    const print = vi.spyOn(window, 'print').mockImplementation(() => undefined);

    printPage();

    expect(print).toHaveBeenCalledOnce();
    print.mockRestore();
  });
});
