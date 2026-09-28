export type ModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  dismissOnBackdrop?: boolean;
};

export const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
