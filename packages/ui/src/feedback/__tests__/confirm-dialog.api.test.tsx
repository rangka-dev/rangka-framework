import { describe, it, expect } from 'vitest';
import { ConfirmDialog } from '../confirm-dialog';
import { render } from '@testing-library/react';

describe('ConfirmDialog API surface', () => {
  it('exports ConfirmDialog component', () => {
    expect(ConfirmDialog).toBeDefined();
  });

  it('has sub-components', () => {
    expect(ConfirmDialog.Title).toBeDefined();
    expect(ConfirmDialog.Description).toBeDefined();
    expect(ConfirmDialog.Actions).toBeDefined();
    expect(ConfirmDialog.Cancel).toBeDefined();
    expect(ConfirmDialog.Confirm).toBeDefined();
  });

  it('renders when open', () => {
    const { baseElement } = render(
      <ConfirmDialog open onOpenChange={() => {}}>
        <ConfirmDialog.Title>Delete item?</ConfirmDialog.Title>
        <ConfirmDialog.Description>This cannot be undone.</ConfirmDialog.Description>
        <ConfirmDialog.Actions>
          <ConfirmDialog.Cancel />
          <ConfirmDialog.Confirm destructive>Delete</ConfirmDialog.Confirm>
        </ConfirmDialog.Actions>
      </ConfirmDialog>,
    );
    expect(baseElement.textContent).toContain('Delete item?');
  });
});
