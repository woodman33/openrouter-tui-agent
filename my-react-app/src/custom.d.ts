import * as React from 'react';

declare global {
  namespace React {
    namespace JSX {
      interface IntrinsicElements {
        'iconify-icon': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
          icon?: string;
          width?: string;
          style?: React.CSSProperties;
        }, HTMLElement>;
      }
    }
  }
}
