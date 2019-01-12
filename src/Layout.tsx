import * as React from 'react';

const Layout: React.SFC = ({ children }) => (
  <div>
    <h1>Hello, world!!</h1>
    <div onClick={()=>{}}>
      pretty good
    </div>
    {children}
  </div>
);

export default Layout;