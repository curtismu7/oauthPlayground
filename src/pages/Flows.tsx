import React from 'react';
import { Outlet } from 'react-router-dom';

const Flows: React.FC = () => {
  return (
    <div>
      <Outlet />
    </div>
  );
};

export default Flows;
