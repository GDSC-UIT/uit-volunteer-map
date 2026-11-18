import { afterEach, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router';
import { RoleEnum } from '@uit-volunteer-map/shared';
import { AuthContext } from '@/contexts/AuthContext';
import LoginPage from './LoginPage';

afterEach(cleanup);
function Destination() { return <p>Destination: {useLocation().pathname}</p>; }
it.each([
 [RoleEnum.ADMIN,'/leader/posts/3','/admin/dashboard'],
 [RoleEnum.LEADER,'/admin/teams','/leader'],
 [RoleEnum.ADMIN,'/admin/teams','/admin/teams'],
 [RoleEnum.LEADER,'/leader/posts/3','/leader/posts/3'],
 [RoleEnum.ADMIN,'/campaign/1','/campaign/1'],
 [RoleEnum.LEADER,'https://example.test','/leader'],
 [RoleEnum.LEADER,'//example.test','/leader'],
 [RoleEnum.ADMIN,undefined,'/admin/dashboard'],
] as const)('routes authenticated %s returning from %s to %s',async(role,from,expected)=>{
 render(<AuthContext.Provider value={{user:{accId:1,username:'synthetic',role},token:'fixture',isAuthenticated:true,isLoading:false,login:async()=>{},logout:async()=>{}}}>
  <MemoryRouter initialEntries={[{pathname:'/login',state:from?{from:{pathname:from}}:undefined}]}>
   <Routes><Route path="/login" element={<LoginPage/>}/><Route path="*" element={<Destination/>}/></Routes>
  </MemoryRouter>
 </AuthContext.Provider>);
 expect(await screen.findByText('Destination: '+expected)).toBeInTheDocument();
});
