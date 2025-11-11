import React from 'react';

export const DRPCBadge: React.FC = () => {
  return (
    <a 
      href="https://drpc.org?ref=c4de57"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-block"
    >
      <img 
        style={{ width: '100px', height: '33px' }} 
        src="https://drpc.org/images/external/powered-by-drpc-light.svg" 
        alt="Powered by dRPC" 
      />
    </a>
  );
};
