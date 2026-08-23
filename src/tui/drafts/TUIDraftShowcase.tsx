import React, { useState } from 'react';
import { Box, Text, useInput, useWindowSize, useApp } from 'ink';
import { useFocus, panelMayAct } from '../hooks/useKeyDispatcher.js';
import { Draft1Cockpit } from './Draft1Cockpit.js';
import { Draft2Swarm } from './Draft2Swarm.js';
import { Draft3Studio } from './Draft3Studio.js';
import { Draft4Browser } from './Draft4Browser.js';
import { Draft5TrustAudit } from './Draft5TrustAudit.js';

export function TUIDraftShowcase() {
  const [activeTab, setActiveTab] = useState(0);
  const { exit } = useApp();
  const { columns, rows } = useWindowSize();

  const width = Math.max(80, columns || 110);
  const height = Math.max(24, rows || 32);

  const __focus = useFocus();
  useInput((input, key) => {
    if (!panelMayAct(__focus, 'input:showcase')) return;
    if (input === '1') setActiveTab(0);
    else if (input === '2') setActiveTab(1);
    else if (input === '3') setActiveTab(2);
    else if (input === '4') setActiveTab(2); // Slate / Studio
    else if (input === '5') setActiveTab(3);
    else if (input === '6') setActiveTab(4);
    else if (input === 'q' || input === 'Q') {
      exit();
    }
  });

  switch (activeTab) {
    case 0:
      return <Draft1Cockpit activeTab={activeTab} setActiveTab={setActiveTab} width={width} height={height} />;
    case 1:
      return <Draft2Swarm activeTab={activeTab} setActiveTab={setActiveTab} width={width} height={height} />;
    case 2:
      return <Draft3Studio activeTab={activeTab} setActiveTab={setActiveTab} width={width} height={height} />;
    case 3:
      return <Draft4Browser activeTab={activeTab} setActiveTab={setActiveTab} width={width} height={height} />;
    case 4:
    default:
      return <Draft5TrustAudit activeTab={activeTab} setActiveTab={setActiveTab} width={width} height={height} />;
  }
}
