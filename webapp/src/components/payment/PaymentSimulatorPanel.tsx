import React from 'react';

export interface PaymentSimulatorPanelProps {
  orderId?: string;
  internalOrderId?: string;
  onStatusChange?: (status: 'completed' | 'failed' | 'pending' | 'cancelled' | 'reset', details?: any) => void;
  className?: string;
}

export default function PaymentSimulatorPanel(_props: PaymentSimulatorPanelProps) {
  return null;
}
