import React from 'react';
import { render } from 'ink';
import { TUIDraftShowcase } from '../src/tui/drafts/TUIDraftShowcase.js';

const app = render(<TUIDraftShowcase />);
app.waitUntilExit();
