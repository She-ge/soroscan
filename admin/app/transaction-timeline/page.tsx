'use client';

import React from 'react';
import { TimelineProvider } from './context';
import { TransactionTimeline } from './TransactionTimeline';

interface TransactionTimelinePageProps {
  contractId?: string;
}

export default function TransactionTimelinePage({ contractId }: TransactionTimelinePageProps) {
  return (
    <TimelineProvider initialContractId={contractId}>
      <div className="h-screen">
        <TransactionTimeline />
      </div>
    </TimelineProvider>
  );
}