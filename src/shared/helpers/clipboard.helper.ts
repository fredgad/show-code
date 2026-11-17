export async function copyText(document: Document, text: string): Promise<void> {
  const clipboard = document.defaultView?.navigator.clipboard;
  if (clipboard?.writeText) {
    await clipboard.writeText(text);
    return;
  }

  const previousFocus = document.activeElement;
  const field = document.createElement('textarea');
  field.value = text;
  field.readOnly = true;
  field.style.position = 'fixed';
  field.style.opacity = '0';
  document.body.appendChild(field);
  try {
    field.select();
    if (!document.execCommand('copy')) {
      throw new Error('Clipboard copy failed');
    }
  } finally {
    field.remove();
    if (previousFocus instanceof HTMLElement) {
      previousFocus.focus({ preventScroll: true });
    }
  }
}
